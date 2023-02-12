import { Text, Button, Flex, Spacer } from "@chakra-ui/react";
import { HashConnectConnectionState } from "hashconnect/dist/esm/types";
import { AccountBalanceJson } from "@hashgraph/sdk";
import { useEffect, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Notification, MetricLabel, NotficationTypes, SettingsButton, useNotification, Color } from "../..";
import { CreatePoolStateFormData, InitialCreatePoolFormState, InputSelectData } from "./constants";
import { FormSettings, useFormSettings } from "../FormSettings";
import { DefiFormLayout } from "../layouts";
import { TokenPair } from "../SwapTokensForm/types";
import { TokenInput } from "../TokenInput";
import { isNil } from "ramda";
import { CreatePoolState, Pool } from "../../../dex-ui/store/poolsSlice";
import { AlertDialog, InputSelector, LoadingDialog } from "../../base";
import { TransactionStatus } from "../../../dex-ui/store/appSlice";
import { WarningIcon } from "@chakra-ui/icons";
import { usePoolsData } from "../../../dex-ui/hooks";
import { REFRESH_INTERVAL } from "../../../dex-ui/hooks/constants";
import {
  getCreatePoolExchangeRate,
  getTokenBalance,
  getTokensByUniqueAccountIds,
  getUniqueTokensFromSelectedOne,
} from "../utils";
import { TokenState } from "../types";
import { CreatePoolTransactionParams } from "./types";
import { useCreatePoolFormData } from "./useCreatePoolForm";
interface CreatePoolFormProps {
  isLoading: boolean;
  pairedAccountBalance: AccountBalanceJson | null;
  tokenPairs: TokenPair[] | null;
  allPoolsMetrics: Pool[];
  transactionState: CreatePoolState;
  connectionStatus: HashConnectConnectionState;
  connectToWallet: () => void;
  sendCreatePoolTransaction: (params: CreatePoolTransactionParams) => Promise<void>;
  resetCreatePoolState: () => Promise<void>;
}

export function CreatePoolForm(props: CreatePoolFormProps) {
  const title = "Create Pool";
  const createPoolForm = useForm<CreatePoolStateFormData>({
    defaultValues: {
      ...InitialCreatePoolFormState,
    },
  });
  const formValues: CreatePoolStateFormData = structuredClone(createPoolForm.getValues());

  createPoolForm.watch([
    "firstToken.displayAmount",
    "firstToken.symbol",
    "secondToken.symbol",
    "secondToken.displayAmount",
    "transactionFee",
  ]);

  const [isConfirmCreatePoolDialogOpen, setIsConfirmCreatePoolDialogOpen] = useState(false);

  usePoolsData(REFRESH_INTERVAL);

  const formSettings = useFormSettings({
    transactionDeadline: formValues.transactionDeadline,
  });

  const createPoolFormData = useCreatePoolFormData({
    firstToken: formValues.firstToken,
    secondToken: formValues.secondToken,
    transactionFee: formValues.transactionFee,
    isTransactionDeadlineValid: formSettings.isTransactionDeadlineValid,
    allPoolsMetrics: props.allPoolsMetrics,
  });

  const notification = useNotification({
    successMessage: createPoolFormData.successMessage,
    transactionState: {
      transactionWaitingToBeSigned: props.transactionState.status === "in progress",
      successPayload: props.transactionState.successPayload?.transactionResponse ?? null,
      errorMessage: props.transactionState.errorMessage,
    },
  });
  const isWalletPaired = props.connectionStatus === HashConnectConnectionState.Paired;

  const tokensWithPairs = getTokensByUniqueAccountIds(props.tokenPairs ?? []);
  const uniqueTokensFromSlectedOne = getUniqueTokensFromSelectedOne(
    formValues.firstToken.tokenMeta.tokenId ?? "",
    props.tokenPairs ?? []
  );

  const getNewPoolExchangeRateDisplay = getCreatePoolExchangeRate({
    firstToken: formValues.firstToken,
    secondToken: formValues.secondToken,
  });

  function handleFirstTokenSymbolChanged(updatedToken: TokenState) {
    const firstTokenBalance = getTokenBalance(updatedToken.tokenMeta.tokenId ?? "", props.pairedAccountBalance);
    const updatedFirstToken = {
      ...formValues.firstToken,
      symbol: updatedToken?.symbol,
      balance: firstTokenBalance,
    };
    createPoolForm.setValue("firstToken.balance", updatedFirstToken.balance);
    createPoolForm.setValue("firstToken.symbol", updatedFirstToken.symbol);
  }

  function handleSecondTokenSymbolChanged(updatedToken: TokenState) {
    const secondTokenBalance = getTokenBalance(updatedToken?.tokenMeta.tokenId ?? "", props.pairedAccountBalance);
    const updatedSecondToken = {
      ...formValues.secondToken,
      symbol: updatedToken?.symbol,
      balance: secondTokenBalance,
    };
    createPoolForm.setValue("secondToken.symbol", updatedSecondToken.symbol);
    createPoolForm.setValue("secondToken.balance", updatedSecondToken.balance);
  }

  function handleFirstTokenAmountChanged(updatedToken: TokenState) {
    const updatedFirstToken = {
      ...formValues.firstToken,
      amount: updatedToken.amount || 0,
      displayAmount: updatedToken.amount ? String(updatedToken.amount) : "",
    };
    createPoolForm.setValue("firstToken.amount", updatedFirstToken.amount);
    createPoolForm.setValue("firstToken.displayAmount", updatedFirstToken.displayAmount);
  }

  function handleSecondTokenAmountChanged(updatedToken: TokenState) {
    const updatedFirstToken = {
      ...formValues.firstToken,
      amount: updatedToken.amount || 0,
      displayAmount: updatedToken.amount ? String(updatedToken.amount) : "",
    };
    createPoolForm.setValue("secondToken.amount", updatedFirstToken.amount);
    createPoolForm.setValue("secondToken.displayAmount", updatedFirstToken.displayAmount);
  }

  function handleTransactionfeeClicked(event: ChangeEvent<HTMLInputElement>) {
    const inputElement = event?.target as HTMLInputElement;
    const fee = inputElement.value;
    createPoolForm.setValue("transactionFee", Number(fee));
  }

  useEffect(() => {
    const firstTokenBalance = getTokenBalance(
      formValues.firstToken.tokenMeta.tokenId ?? "",
      props.pairedAccountBalance
    );
    const secondTokenBalance = getTokenBalance(
      formValues.secondToken.tokenMeta.tokenId ?? "",
      props.pairedAccountBalance
    );
    createPoolForm.setValue("firstToken.balance", firstTokenBalance);
    createPoolForm.setValue("secondToken.balance", secondTokenBalance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.pairedAccountBalance), formValues.firstToken, formValues.secondToken]);

  function onSubmit(data: CreatePoolStateFormData) {
    if (data.firstToken.symbol === undefined || data.secondToken.symbol === undefined) {
      console.error("Tokens must be selected to create a pool.");
      return;
    }
    props.sendCreatePoolTransaction({
      firstToken: {
        symbol: data.firstToken.symbol,
        address: data.firstToken.tokenMeta.tokenId ?? "",
        qunatity: data.firstToken.amount,
      },
      secondToken: {
        symbol: data.secondToken.symbol,
        address: data.secondToken.tokenMeta.tokenId ?? "",
        qunatity: data.secondToken.amount,
      },
      transactionFee: data.transactionFee,
      transactionDeadline: data.transactionDeadline,
    });
  }
  return (
    <form onSubmit={createPoolForm.handleSubmit(onSubmit)} id="create-pool-form">
      <DefiFormLayout
        title={<Text textStyle="h2">{title}</Text>}
        settingsButton={
          <SettingsButton
            isError={!formSettings.isTransactionDeadlineValid}
            display={formSettings.formattedTransactionDeadline}
            onClick={formSettings.handleSettingsButtonClicked}
          />
        }
        notification={
          notification.isSuccessNotificationVisible && (
            <Notification
              type={NotficationTypes.SUCCESS}
              textStyle="b3"
              message={notification.successNotificationMessage}
              isLinkShown={true}
              linkText="View in HashScan"
              linkRef={notification.hashscanTransactionLink}
              isCloseButtonShown={true}
              handleClickClose={notification.handleCloseNotificationButtonClicked}
            />
          )
        }
        settingsInputs={
          <FormSettings
            isSettingsOpen={formSettings.isSettingsOpen}
            hideSlippage
            isTransactionDeadlineValid={formSettings.isTransactionDeadlineValid}
            handleSlippageChanged={formSettings.handleSlippageChanged}
            handleTransactionDeadlineChanged={formSettings.handleTransactionDeadlineChanged}
            register={createPoolForm.register}
          />
        }
        isSettingsOpen={formSettings.isSettingsOpen}
        formInputs={[
          <TokenInput
            form={createPoolForm}
            fieldValue="firstToken"
            label="First Token"
            isHalfAndMaxButtonsVisible={true}
            walletConnectionStatus={props.connectionStatus}
            pairedAccountBalance={props.pairedAccountBalance}
            selectedTokenId={formValues.firstToken.tokenMeta.tokenId ?? ""}
            selectableTokens={tokensWithPairs}
            isLoading={props.isLoading}
            tokenPairs={props.tokenPairs ?? []}
            onTokenAmountChanged={handleFirstTokenAmountChanged}
            onTokenSymbolChanged={handleFirstTokenSymbolChanged}
          />,
          <TokenInput
            form={createPoolForm}
            fieldValue="secondToken"
            label="Second Token"
            isHalfAndMaxButtonsVisible={true}
            walletConnectionStatus={props.connectionStatus}
            pairedAccountBalance={props.pairedAccountBalance}
            selectedTokenId={formValues.secondToken.tokenMeta.tokenId ?? ""}
            selectableTokens={uniqueTokensFromSlectedOne}
            isLoading={props.isLoading}
            tokenPairs={props.tokenPairs ?? []}
            onTokenAmountChanged={handleSecondTokenAmountChanged}
            onTokenSymbolChanged={handleSecondTokenSymbolChanged}
          />,
          <Spacer padding="0.4rem" />,
          <Flex direction="column" justifyContent="center" gap="5px">
            <Text textStyle="h4">Transaction Fee</Text>
            <InputSelector
              data={InputSelectData}
              value={formValues.transactionFee}
              selectControls={createPoolForm.register("transactionFee" as any, {
                onChange: handleTransactionfeeClicked,
              })}
            />
          </Flex>,
        ]}
        metrics={[
          //eslint-disable-next-line max-len
          <MetricLabel label="Exchange Ratio" value={getNewPoolExchangeRateDisplay} isLoading={props.isLoading} />,
        ]}
        actionButtonNotifications={[
          !formSettings.isTransactionDeadlineValid ? (
            <Notification
              type={NotficationTypes.ERROR}
              textStyle="b3"
              message={formSettings.transactionDeadlineErrorMessage}
            />
          ) : null,
          createPoolFormData.isSelectedPoolAlreadyExist ? (
            <Notification
              type={NotficationTypes.ERROR}
              textStyle="b3"
              message={createPoolFormData.poolAlreadyExistMessage}
            />
          ) : null,
        ].filter((notification: React.ReactNode) => !isNil(notification))}
        actionButtons={
          isWalletPaired ? (
            <>
              <AlertDialog
                title="Confirm Create Pool"
                openDialogButtonText="Create Pool"
                isOpenDialogButtonDisabled={createPoolFormData.isSubmitButtonDisabled}
                body={
                  <Flex flexDirection="column">
                    <Flex paddingBottom="0.25rem">
                      <Text flex="2" textStyle="b1">
                        First Token
                      </Text>
                      <Text flex="2" textStyle="b1" textAlign="right">
                        {formValues.firstToken.displayAmount}
                      </Text>
                    </Flex>
                    <Flex>
                      <Text flex="2" textStyle="b1">
                        Second Token
                      </Text>
                      <Text flex="2" textStyle="b1" textAlign="right">
                        {formValues.secondToken.displayAmount}
                      </Text>
                    </Flex>
                    <Spacer padding="0.667rem" />
                    <Flex flexDirection="column" gap="0.5rem">
                      <Flex>
                        <Text flex="1" textStyle="b3" color={Color.Grey_02}>
                          Exchange Rate
                        </Text>
                        <Text flex="2" textStyle="b3" textAlign="right">
                          {getNewPoolExchangeRateDisplay}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text flex="1" textStyle="b3" color={Color.Grey_02}>
                          Gas Fee
                        </Text>
                        <Text flex="2" textStyle="b3" textAlign="right">
                          {"--"}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                }
                footer={
                  <Button
                    variant="primary"
                    flex="1"
                    isDisabled={createPoolFormData.isSubmitButtonDisabled}
                    onClick={() => {
                      setIsConfirmCreatePoolDialogOpen(false);
                      createPoolForm.handleSubmit(onSubmit)();
                      notification.setIsNotificationVisible(true);
                    }}
                  >
                    Create Pool
                  </Button>
                }
                alertDialogOpen={isConfirmCreatePoolDialogOpen}
                onAlertDialogOpen={() => setIsConfirmCreatePoolDialogOpen(true)}
                onAlertDialogClose={() => setIsConfirmCreatePoolDialogOpen(false)}
              />
              <LoadingDialog
                isOpen={props.transactionState.status === TransactionStatus.IN_PROGRESS}
                message={"Please confirm the create pool transaction in your wallet to proceed."}
              />
              <LoadingDialog
                isOpen={props.transactionState.status === TransactionStatus.ERROR}
                message={props.transactionState.errorMessage ?? ""}
                icon={<WarningIcon color="#EF5C5C" h={10} w={10} />}
                buttonConfig={{
                  text: "Dismiss",
                  onClick: () => {
                    props.resetCreatePoolState();
                  },
                }}
              />
            </>
          ) : (
            <Button variant="primary" data-testid="connect-wallet-button" onClick={props.connectToWallet}>
              Connect Wallet
            </Button>
          )
        }
      />
    </form>
  );
}
