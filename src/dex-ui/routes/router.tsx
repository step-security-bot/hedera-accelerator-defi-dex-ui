import { Flex } from "@chakra-ui/react";
import { AppLayout, NotFound } from "@layouts";
import {
  SwapPage,
  Pools,
  AddLiquidityPage,
  WithdrawPage,
  CreatePoolPage,
  Governance,
  ProposalDetails,
  CreateNewProposal,
  CreateADAOPage,
  DAOsListPage,
  DashboardOverview,
  TransactionsList,
  AssetsList,
  MembersList,
  MultiSigDAODashboard,
  GovernanceDAODashboard,
  NFTDAODashboard,
  Settings,
  AddMember,
  DeleteMember,
  ReplaceMember,
  ChangeThreshold,
  TextProposalForm,
  ContractUpgradeProposalForm,
  TokenTransferProposalForm,
  CreateTokenProposalForm,
  SendTokenWizard,
  SendTokenDetailsForm,
  SendTokenReviewForm,
  GovernanceDAODashboardOverview,
} from "@pages";
import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import { Paths } from "@routes";
import { TokenTransactionDetails } from "@dex-ui/pages/dao/TokenTransactionDetails";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={Paths.Home} element={<AppLayout />}>
      <Route index element={<Navigate to="swap" />} />
      {/* TODO: Create Swap/Pool route heirarchy. */}
      <Route path={Paths.Swap.default} element={<SwapPage />} />
      <Route path={Paths.Pools.default} element={<Pools />} />
      <Route path={`${Paths.Pools.AddLiquidity}/:pairId/:poolName`} element={<AddLiquidityPage />} />
      <Route path={Paths.Pools.Withdraw} element={<WithdrawPage />} />
      <Route path={Paths.Pools.CreatePool} element={<CreatePoolPage />} />
      <Route path={Paths.Governance.default}>
        <Route index element={<Governance />} />
        <Route path={`${Paths.Governance.ProposalDetails}/:id`} element={<ProposalDetails />} />
        <Route path={Paths.Governance.CreateNewProposal}>
          <Route index element={<CreateNewProposal />} />
          <Route path={Paths.Governance.CreateNewToken} element={<CreateTokenProposalForm />} />
          <Route path={Paths.Governance.CreateText} element={<TextProposalForm />} />
          <Route path={Paths.Governance.CreateTokenTransfer} element={<TokenTransferProposalForm />} />
          <Route path={Paths.Governance.CreateContractUpgrade} element={<ContractUpgradeProposalForm />} />
        </Route>
      </Route>
      {/* TODO: Create DAO route heirarchy. */}
      <Route path={Paths.DAOs.default}>
        <Route index element={<DAOsListPage />} />
        <Route path={Paths.DAOs.Create} element={<CreateADAOPage />} />
        <Route path={"multisig/:accountId"} element={<MultiSigDAODashboard />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path={Paths.DAOs.Dashboard} element={<DashboardOverview />} />
          <Route path={Paths.DAOs.TransactionDetails} element={<TransactionsList />} />
          <Route path={Paths.DAOs.Assets} element={<AssetsList />} />
          <Route path={Paths.DAOs.Members} element={<MembersList />} />
          <Route path={Paths.DAOs.Settings} element={<Settings />} />
        </Route>
        <Route path={"governance-token/:accountId"} element={<GovernanceDAODashboard />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path={Paths.DAOs.Dashboard} element={<GovernanceDAODashboardOverview />} />
          <Route
            path={Paths.DAOs.TransactionDetails}
            element={<NotFound message={`The transactions page is under construction`} />}
          />
          <Route path={Paths.DAOs.Assets} element={<NotFound message={`The assets page is under construction`} />} />
          <Route path={Paths.DAOs.Staking} element={<NotFound message={`The staking page is under construction`} />} />
          <Route path={Paths.DAOs.Members} element={<MembersList />} />
          <Route path={Paths.DAOs.Settings} element={<Settings />} />
        </Route>
        <Route path={"nft/:accountId"} element={<NFTDAODashboard />} />
        <Route path="multisig/:accountId/send-token" element={<SendTokenWizard />}>
          <Route index element={<Navigate to="details" />} />
          <Route path="details" element={<SendTokenDetailsForm />} />
          <Route path="review" element={<SendTokenReviewForm />} />
        </Route>
        <Route path={"multisig/:accountId/settings/add-member"} element={<AddMember />} />
        <Route path={"multisig/:accountId/settings/delete-member/:memberId"} element={<DeleteMember />} />
        <Route path={"multisig/:accountId/settings/replace-member/:memberId"} element={<ReplaceMember />} />
        <Route path={"multisig/:accountId/settings/change-threshold"} element={<ChangeThreshold />} />
        <Route path={"multisig/:accountId/transactions/:transactionHash"} element={<TokenTransactionDetails />} />
      </Route>
      <Route
        path="*"
        element={
          <Flex width="100%" height="70vh" justifyContent="center" alignItems="center">
            <NotFound message={`Page not found.`} />
          </Flex>
        }
      />
    </Route>
  )
);