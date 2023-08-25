import { Text, FormControl, Select, FormErrorMessage } from "@chakra-ui/react";
import { UseFormRegisterReturn } from "react-hook-form";

interface DropdownOption {
  label: string;
  value: string | number;
}

interface FormDropdownProps {
  label: string;
  placeholder: string;
  data: DropdownOption[];
  isInvalid?: boolean;
  errorMessage?: string | undefined;
  register?: UseFormRegisterReturn;
}

export function FormDropdown(props: FormDropdownProps) {
  const { label, placeholder, data, isInvalid, errorMessage, register } = props;

  return (
    <FormControl isInvalid={isInvalid}>
      <Text textStyle="p small medium" marginBottom="0.25rem">
        {label}
      </Text>
      <Select variant="formTokenSelector" placeholder={placeholder} {...register}>
        {data.map((option: DropdownOption) => {
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </Select>
      <FormErrorMessage>{errorMessage}</FormErrorMessage>
    </FormControl>
  );
}