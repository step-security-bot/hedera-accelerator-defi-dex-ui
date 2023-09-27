import { Color, DefaultLogoIcon, FormInput, FormInputList, FormTextArea } from "@shared/ui-kit";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Image,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { SettingsForm } from "./types";

export function UpdateDAODetailsForm() {
  const {
    register,
    control,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<SettingsForm>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "webLinks",
  });

  watch("logoUrl");
  const { logoUrl } = getValues();

  return (
    <Flex direction="column" gap="1.3rem">
      <FormInput<"name">
        inputProps={{
          id: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter the name of your DAO",
          register: {
            ...register("name", {
              required: { value: true, message: "A name is required." },
            }),
          },
        }}
        isInvalid={Boolean(errors.name)}
        errorMessage={errors.name && errors.name.message}
      />
      <FormTextArea<"description">
        textAreaProps={{
          id: "description",
          label: "Description",
          placeholder: "Add a description for your DAO",
          register: {
            ...register("description", {
              required: { value: true, message: "A description is required." },
              validate: (value) => value.length <= 240 || "Maximum character count for the description is 240.",
            }),
          },
        }}
        isInvalid={Boolean(errors.description)}
        errorMessage={errors.description && errors.description.message}
      />
      <Flex direction="row" gap="10px" justifyContent="flex-end">
        <FormInput<"logoUrl">
          inputProps={{
            id: "logoUrl",
            label: "Logo",
            type: "text",
            placeholder: "Enter image URL",
            register: {
              ...register("logoUrl"),
            },
          }}
        />
        <Image
          src={logoUrl}
          objectFit="contain"
          alt="Logo URl"
          alignSelf="end"
          boxSize="4rem"
          fallback={<DefaultLogoIcon boxSize="4rem" alignSelf="end" color={Color.Grey_Blue._100} />}
        />
      </Flex>
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <Text textStyle="p medium medium">
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                DAO Links
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </Text>
          <AccordionPanel pb={4}>
            <SimpleGrid row={1} spacingX="1rem" spacingY="0.75rem">
              <FormInputList<SettingsForm, "webLinks">
                fields={fields}
                defaultFieldValue={{ value: "" }}
                formPath="webLinks"
                fieldPlaceholder="Enter URL"
                fieldLabel=""
                fieldButtonText="+ Add Link"
                append={append}
                remove={remove}
                register={register}
              />
            </SimpleGrid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
}
