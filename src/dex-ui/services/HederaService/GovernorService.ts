import { BigNumber } from "bignumber.js";
import {
  TokenId,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TransactionResponse,
  FileCreateTransaction,
  PublicKey,
  ContractCreateTransaction,
  FileAppendTransaction,
} from "@hashgraph/sdk";
import { ContractId } from "@hashgraph/sdk";
import { GovernorProxyContracts, TOKEN_USER_PUB_KEY } from "../constants";
import { GovernorContractFunctions } from "./types";
import { HashConnectSigner } from "hashconnect/dist/esm/provider/signer";
import { checkTransactionResponseForError, client } from "./utils";

/**
 * General format of service calls:
 * 1 - Convert data types.
 * 2 - Create contract parameters.
 * 3 - Create and sign transaction.
 * 4 - Send transaction to wallet and execute transaction.
 * 5 - Extract and return resulting data.
 */
interface CastVoteParams {
  contractId: string;
  proposalId: string;
  voteType: number;
  signer: HashConnectSigner;
}

/**
 * TODO
 * @param params -
 * @returns
 */
const castVote = async (params: CastVoteParams) => {
  const { contractId, proposalId, voteType, signer } = params;
  const governorContractId = ContractId.fromString(contractId);
  const preciseProposalId = BigNumber(proposalId);
  const contractFunctionParameters = new ContractFunctionParameters().addUint256(preciseProposalId).addUint8(voteType);
  const castVoteTransaction = await new ContractExecuteTransaction()
    .setContractId(governorContractId)
    .setFunction(GovernorContractFunctions.CastVote, contractFunctionParameters)
    .setGas(900000)
    .freezeWithSigner(signer);
  const response = await castVoteTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(response, GovernorContractFunctions.CastVote);
  return response;
};

interface CancelProposalParams {
  contractId: string;
  title: string;
  signer: HashConnectSigner;
}

/**
 * TODO
 * @param params -
 * @returns
 */
const cancelProposal = async (params: CancelProposalParams) => {
  const { contractId, title, signer } = params;
  const governorContractId = ContractId.fromString(contractId);
  const contractFunctionParameters = new ContractFunctionParameters().addString(title);
  const cancelProposalTransaction = await new ContractExecuteTransaction()
    .setContractId(governorContractId)
    .setFunction(GovernorContractFunctions.CancelProposal, contractFunctionParameters)
    .setGas(900000)
    .freezeWithSigner(signer);
  const response = await cancelProposalTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(response, GovernorContractFunctions.CancelProposal);
  return response;
};

interface CreateTransferTokenProposalParams {
  title: string;
  description: string;
  linkToDiscussion: string;
  accountToTransferTo: string;
  tokenToTransfer: string;
  amountToTransfer: BigNumber;
  signer: HashConnectSigner;
}

/**
 * TODO
 * @param params -
 * @returns
 */
const sendCreateTransferTokenProposalTransaction = async (
  params: CreateTransferTokenProposalParams
): Promise<TransactionResponse> => {
  const { title, description, linkToDiscussion, accountToTransferTo, tokenToTransfer, amountToTransfer, signer } =
    params;
  const transferFromAddress = signer.getAccountId().toSolidityAddress();
  const transferToAddress = AccountId.fromString(accountToTransferTo).toSolidityAddress();
  const tokenToTransferAddress = TokenId.fromString(tokenToTransfer).toSolidityAddress();
  const contractCallParams = new ContractFunctionParameters()
    .addString(title)
    .addString(description)
    .addString(linkToDiscussion)
    .addAddress(transferFromAddress)
    .addAddress(transferToAddress)
    .addAddress(tokenToTransferAddress)
    .addInt256(amountToTransfer);

  const createProposalTransaction = await new ContractExecuteTransaction()
    .setContractId(GovernorProxyContracts.TransferTokenContractId)
    .setFunction(GovernorContractFunctions.CreateProposal, contractCallParams)
    .setGas(9000000)
    .freezeWithSigner(signer);
  const proposalTransactionResponse = await createProposalTransaction.executeWithSigner(signer);
  return proposalTransactionResponse;
};

interface CreateContratctUpgradeProposalParams {
  title: string;
  description: string;
  linkToDiscussion: string;
  contarctId: string;
  proxyId: string;
  signer: HashConnectSigner;
}

/**
 * TODO
 * @param params -
 * @returns
 */
const sendCreateContractUpgradeProposalTransaction = async (
  params: CreateContratctUpgradeProposalParams
): Promise<TransactionResponse> => {
  const { title, linkToDiscussion, description, contarctId, proxyId, signer } = params;
  const upgradeProposalContractId = ContractId.fromString(contarctId).toSolidityAddress();
  const upgradeProposalProxyId = ContractId.fromString(proxyId).toSolidityAddress();

  const contractCallParams = new ContractFunctionParameters()
    .addString(title)
    .addString(description)
    .addString(linkToDiscussion)
    .addAddress(upgradeProposalProxyId)
    .addAddress(upgradeProposalContractId);

  const createUpgradeProposalTransaction = await new ContractExecuteTransaction()
    .setContractId(GovernorProxyContracts.ContractUpgradeContractId)
    .setFunction(GovernorContractFunctions.CreateProposal, contractCallParams)
    .setGas(9000000)
    .freezeWithSigner(signer);
  const proposalTransactionResponse = await createUpgradeProposalTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(proposalTransactionResponse, GovernorContractFunctions.CreateProposal);
  return proposalTransactionResponse;
};

/**
 * TODO
 * @param description -
 * @param signer -
 * @returns
 */
const sendCreateTextProposalTransaction = async (
  title: string,
  description: string,
  linkToDiscussion: string,
  signer: HashConnectSigner
): Promise<TransactionResponse> => {
  const contractCallParams = new ContractFunctionParameters()
    .addString(title)
    .addString(description)
    .addString(linkToDiscussion);
  const createProposalTransaction = await new ContractExecuteTransaction()
    .setContractId(GovernorProxyContracts.TextProposalContractId)
    .setFunction(GovernorContractFunctions.CreateProposal, contractCallParams)
    .setGas(9000000)
    .freezeWithSigner(signer);
  const proposalTransactionResponse = await createProposalTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(proposalTransactionResponse, GovernorContractFunctions.CreateProposal);
  return proposalTransactionResponse;
};
interface ExecuteProposalParams {
  contractId: string;
  title: string;
  signer: HashConnectSigner;
}

/**
 * TODO
 * @param params -
 * @returns
 */
const executeProposal = async (params: ExecuteProposalParams) => {
  const { contractId, title, signer } = params;
  const governorContractId = ContractId.fromString(contractId);
  /** This parameter is named 'description' on the contract function */
  const contractFunctionParameters = new ContractFunctionParameters().addString(title);
  const executeProposalTransaction = await new ContractExecuteTransaction()
    .setContractId(governorContractId)
    .setFunction(GovernorContractFunctions.ExecuteProposal, contractFunctionParameters)
    .setGas(1000000)
    .freezeWithSigner(signer);
  const executeTransactionResponse = await executeProposalTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(executeTransactionResponse, GovernorContractFunctions.ExecuteProposal);
  return executeTransactionResponse;
};

interface SendClaimGODTokenTransactionParams {
  contractId: string;
  proposalId: string;
  signer: HashConnectSigner;
}

const sendClaimGODTokenTransaction = async (params: SendClaimGODTokenTransactionParams) => {
  const { contractId, proposalId, signer } = params;
  const preciseProposalId = BigNumber(proposalId);
  const governorContractId = ContractId.fromString(contractId);
  const contractFunctionParameters = new ContractFunctionParameters().addUint256(preciseProposalId);
  const executeClaimGODTokenTransaction = await new ContractExecuteTransaction()
    .setContractId(governorContractId)
    .setFunction(GovernorContractFunctions.ClaimGODToken, contractFunctionParameters)
    .setGas(900000)
    .freezeWithSigner(signer);
  const claimGODTokenresponse = await executeClaimGODTokenTransaction.executeWithSigner(signer);
  checkTransactionResponseForError(claimGODTokenresponse, GovernorContractFunctions.ClaimGODToken);
  return claimGODTokenresponse;
};

/**
 * TODO
 * @param params -
 * @returns
 */
const deployABIFile = async (abiFile: string) => {
  const compiledContract = JSON.parse(abiFile);
  const contractByteCode = compiledContract.bytecode;
  const userKey = PublicKey.fromString(TOKEN_USER_PUB_KEY);

  const fileCreateTx = await new FileCreateTransaction().setKeys([userKey]).execute(client);
  const fileCreateRx = await fileCreateTx.getReceipt(client);
  const bytecodeFileId = fileCreateRx.fileId;

  const fileAppendTx = await new FileAppendTransaction()
    .setFileId(bytecodeFileId ?? "")
    .setContents(contractByteCode)
    .setMaxChunks(100)
    .execute(client);
  await fileAppendTx.getReceipt(client);

  const contractCreateTx = await new ContractCreateTransaction()
    .setAdminKey(userKey)
    .setBytecodeFileId(bytecodeFileId ?? "")
    .setConstructorParameters(new ContractFunctionParameters())
    .setGas(9000000)
    .execute(client);

  const deployABIFileResponse = await contractCreateTx.getReceipt(client);
  const contractId = deployABIFileResponse.contractId;
  // client.close();

  checkTransactionResponseForError(deployABIFileResponse, GovernorContractFunctions.DeployABIFile);
  return {
    id: contractId?.toString() ?? "",
    address: "0x" + contractId?.toSolidityAddress() ?? "",
  };
};

const GovernorService = {
  sendClaimGODTokenTransaction,
  castVote,
  cancelProposal,
  sendCreateTextProposalTransaction,
  sendCreateTransferTokenProposalTransaction,
  executeProposal,
  deployABIFile,
  sendCreateContractUpgradeProposalTransaction,
};

export default GovernorService;
