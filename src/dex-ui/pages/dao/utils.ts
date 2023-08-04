import { StepProps } from "@dex-ui-components";
import {
  Proposal,
  ProposalDataAddMember,
  ProposalDataChangeThreshold,
  ProposalDataDeleteMember,
  ProposalDataReplaceMember,
  ProposalDataTokenAssociation,
  ProposalType,
} from "@hooks";
import { ProposalState } from "@store/governanceSlice";
import { HBARTokenSymbol, SENTINEL_OWNER, solidityAddressToTokenIdString } from "@services";
import { TokenId } from "@hashgraph/sdk";
import { isHbarToken } from "@utils";

export function getDAOLinksRecordArray(links: string[]): Record<"value", string>[] {
  const arrayOfRecords = links.map((linkString) => {
    return { value: linkString };
  });
  return arrayOfRecords;
}

interface GetPreviousMemberAddressParams {
  memberId: string;
  owners: string[];
}

export function getPreviousMemberAddress(params: GetPreviousMemberAddressParams): string {
  const { memberId, owners } = params;
  const index = owners.findIndex((owner) => owner === memberId);
  const prevMemberAddress = index === 0 ? SENTINEL_OWNER : owners[index - 1];
  return prevMemberAddress;
}

enum StepperProposalStatus {
  Created = "Created",
  Active = "Active",
  Queued = "Queued to Execute",
  Executed = "Executed",
  Defeated = "Defeated",
  Cancelled = "Cancelled",
}

export function getProposalSteps(
  state: ProposalState,
  isExecutionProcessing: boolean,
  hasExecutionFailed: boolean
): { steps: StepProps[]; activeStep: number } {
  let steps: StepProps[] = [];
  let activeStep = 0;
  if (
    state === ProposalState.Pending ||
    state === ProposalState.Active ||
    state === ProposalState.Succeeded ||
    state === ProposalState.Queued ||
    state === ProposalState.Executed
  ) {
    steps = [
      {
        label: StepperProposalStatus.Created,
      },
      {
        label: StepperProposalStatus.Active,
      },
      {
        label: StepperProposalStatus.Queued,
        isLoading: isExecutionProcessing,
        isError: hasExecutionFailed,
      },
      {
        label: StepperProposalStatus.Executed,
      },
    ];
    if (state === ProposalState.Pending || state === ProposalState.Active) {
      activeStep = 1;
    } else if (state === ProposalState.Succeeded || state === ProposalState.Queued) {
      activeStep = 2;
    } else {
      activeStep = 4;
    }
  } else if (state === ProposalState.Canceled) {
    steps = [
      {
        label: StepperProposalStatus.Created,
      },
      {
        label: StepperProposalStatus.Active,
      },
      {
        label: StepperProposalStatus.Cancelled,
        isError: true,
      },
    ];
    activeStep = 2;
  } else if (state === ProposalState.Defeated || state === ProposalState.Expired) {
    steps = [
      {
        label: StepperProposalStatus.Created,
      },
      {
        label: StepperProposalStatus.Active,
      },
      {
        label: StepperProposalStatus.Defeated,
        isError: true,
      },
    ];
    activeStep = 2;
  }
  return { steps, activeStep };
}

export function getProposalData(proposal: Proposal): string {
  switch (proposal.type) {
    case ProposalType.AddNewMember: {
      const { owner, _threshold } = proposal.data as ProposalDataAddMember;
      const ownerAddress = solidityAddressToTokenIdString(owner);
      return `Proposed to add new member ${ownerAddress} and change threshold to ${_threshold}`;
    }
    case ProposalType.RemoveMember: {
      const { owner, _threshold } = proposal.data as ProposalDataDeleteMember;
      const ownerAddress = solidityAddressToTokenIdString(owner);
      return `Proposed to remove member ${ownerAddress} and change threshold to ${_threshold}`;
    }
    case ProposalType.ReplaceMember: {
      const { oldOwner, newOwner } = proposal.data as ProposalDataReplaceMember;
      const oldOwnerAddress = solidityAddressToTokenIdString(oldOwner);
      const newOwnerAddress = solidityAddressToTokenIdString(newOwner);
      return `Proposed to replace member ${oldOwnerAddress} with ${newOwnerAddress}`;
    }
    case ProposalType.ChangeThreshold: {
      const { _threshold } = proposal.data as ProposalDataChangeThreshold;
      return `Proposed to change required threshold to ${_threshold}`;
    }
    case ProposalType.TokenAssociate: {
      const { tokenAddress } = proposal.data as ProposalDataTokenAssociation;
      const tokenToAssociate = TokenId.fromSolidityAddress(tokenAddress).toString();
      return isHbarToken(tokenToAssociate)
        ? `Associate Token: ${HBARTokenSymbol}`
        : `Associate Token: ${tokenToAssociate}`;
    }
    default:
      return "";
  }
}
