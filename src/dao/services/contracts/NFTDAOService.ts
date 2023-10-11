import { BigNumber } from "bignumber.js";
import { HashConnectSigner } from "hashconnect/dist/esm/provider/signer";
import { ethers } from "ethers";
import {
  AccountId,
  TokenId,
  ContractId,
  ContractExecuteTransaction,
  TransactionResponse,
  TokenMintTransaction,
  ContractFunctionParameters,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import { BaseDAOContractFunctions, NFTDAOContractFunctions } from "./types";
import { DexService, checkTransactionResponseForError } from "@dex/services";
import { Contracts } from "@dex/services/constants";
import NFTDAOFactoryJSON from "@dex/services/abi/NFTDAOFactory.json";
import { NFTDAOFunctions } from "../types";

const Gas = 9000000;

interface SendCreateNFTDAOTransactionParams {
  name: string;
  logoUrl: string;
  isPrivate: boolean;
  description: string;
  daoLinks: string[];
  tokenId: string;
  treasuryWalletAccountId: string;
  quorum: number;
  votingDuration: number;
  lockingDuration: number;
  daoFee: number;
  signer: HashConnectSigner;
}
interface MintNFTTokensTransactionParams {
  tokenLinks: string[];
  tokenId: string;
  signer: HashConnectSigner;
}

async function sendCreateNFTDAOTransaction(params: SendCreateNFTDAOTransactionParams): Promise<TransactionResponse> {
  const {
    name,
    logoUrl,
    treasuryWalletAccountId,
    tokenId,
    quorum,
    lockingDuration,
    votingDuration,
    isPrivate,
    description,
    daoLinks,
    daoFee,
    signer,
  } = params;
  const nftDAOFactoryContractId = ContractId.fromString(Contracts.NFTDAOFactory.ProxyId);
  const daoAdminAddress = AccountId.fromString(treasuryWalletAccountId).toSolidityAddress();
  const tokenAddress = TokenId.fromString(tokenId).toSolidityAddress();
  const preciseQuorum = BigNumber(Math.round(quorum * 100)); // Quorum is incremented in 1/100th of percent;
  const preciseLockingDuration = BigNumber(lockingDuration);
  const preciseVotingDuration = BigNumber(votingDuration);
  /* TODO: Replace this with real info url event data */
  const infoUrl = "info-url";

  const createDaoParams: any[] = [
    daoAdminAddress,
    name,
    logoUrl,
    infoUrl,
    tokenAddress,
    preciseQuorum.toNumber(),
    preciseLockingDuration.toNumber(),
    preciseVotingDuration.toNumber(),
    isPrivate,
    description,
    daoLinks,
  ];
  const contractInterface = new ethers.utils.Interface(NFTDAOFactoryJSON.abi);
  const data = contractInterface.encodeFunctionData(BaseDAOContractFunctions.CreateDAO, [createDaoParams]);
  const tokenAmount = Hbar.from(daoFee, HbarUnit.Tinybar).to(HbarUnit.Hbar).toNumber();
  await DexService.setHbarTokenAllowance({
    walletId: signer.getAccountId().toString(),
    spenderContractId: Contracts.MultiSigDAOFactory.ProxyId,
    tokenAmount,
    signer,
  });
  const createNFTDAOTransaction = await new ContractExecuteTransaction()
    .setContractId(nftDAOFactoryContractId)
    .setFunctionParameters(ethers.utils.arrayify(data))
    .setGas(Gas)
    .setPayableAmount(tokenAmount)
    .freezeWithSigner(signer);
  const createGovernanceDAOResponse = await createNFTDAOTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(createGovernanceDAOResponse, BaseDAOContractFunctions.CreateDAO);
  return createGovernanceDAOResponse;
}

async function sendMintNFTTokensTransaction(params: MintNFTTokensTransactionParams): Promise<TransactionResponse> {
  const { tokenId, tokenLinks, signer } = params;
  const data = tokenLinks.map((link) => Buffer.from(link));
  const mintNFTTokensTransaction = await new TokenMintTransaction()
    .setMaxTransactionFee(10)
    .setTokenId(tokenId)
    .setMetadata(data)
    .freezeWithSigner(signer);
  const mintNFTTokensResponse = await mintNFTTokensTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(mintNFTTokensResponse, NFTDAOContractFunctions.MintTokens);
  return mintNFTTokensResponse;
}

interface SendLockNFTTokenTransactionParams {
  nftTokenSerialId: number;
  tokenHolderAddress: string;
  signer: HashConnectSigner;
}

const sendLockNFTTokenTransaction = async (params: SendLockNFTTokenTransactionParams) => {
  const { nftTokenSerialId, signer, tokenHolderAddress } = params;
  const godHolderContractId = ContractId.fromString(tokenHolderAddress);
  const contractFunctionParameters = new ContractFunctionParameters().addUint256(nftTokenSerialId);
  const executeSendLockGODTokenTransaction = await new ContractExecuteTransaction()
    .setContractId(godHolderContractId)
    .setFunction(NFTDAOFunctions.GrabTokensFromUser, contractFunctionParameters)
    .setGas(900000)
    .freezeWithSigner(signer);
  const sendLockGODTokenResponse = await executeSendLockGODTokenTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(sendLockGODTokenResponse, NFTDAOFunctions.GrabTokensFromUser);
  return sendLockGODTokenResponse;
};

interface SendUnLockNFTTokenTransactionParams {
  tokenHolderAddress: string;
  signer: HashConnectSigner;
}

const sendUnLockNFTTokenTransaction = async (params: SendUnLockNFTTokenTransactionParams) => {
  const { signer, tokenHolderAddress } = params;
  const godHolderContractId = ContractId.fromString(tokenHolderAddress);
  const contractFunctionParameters = new ContractFunctionParameters().addUint256(0);
  const executeSendUnLockGODTokenTransaction = await new ContractExecuteTransaction()
    .setContractId(godHolderContractId)
    .setFunction(NFTDAOFunctions.RevertTokensForVoter, contractFunctionParameters)
    .setGas(900000)
    .freezeWithSigner(signer);
  const sendUnLockGODTokenResponse = await executeSendUnLockGODTokenTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(sendUnLockGODTokenResponse, NFTDAOFunctions.RevertTokensForVoter);
  return sendUnLockGODTokenResponse;
};

export {
  sendCreateNFTDAOTransaction,
  sendMintNFTTokensTransaction,
  sendLockNFTTokenTransaction,
  sendUnLockNFTTokenTransaction,
};
