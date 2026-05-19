import TeamSelectField from "./team-select-field";
import TextField from "./text-field";
import OptionSelectField from "./option-select-field";
import { PredictionFieldConfig, Team } from "@/types";

type Props = {
  field: PredictionFieldConfig;
  value: string | number | null;
  teams: Team[];
  onChange: (name: string, value: string | number | null) => void;
};

export default function PredictionField({
  field,
  value,
  teams,
  onChange,
}: Props) {
  switch (field.type) {
    case "team-select":
      return (
        <TeamSelectField
          label={field.label}
          value={typeof value === "number" ? value : null}
          teams={teams}
          onChange={(newValue) => onChange(field.name, newValue)}
        />
      );

    case "text":
      return (
        <TextField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(newValue) => onChange(field.name, newValue)}
        />
      );

    case "select":
      return (
        <OptionSelectField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          options={field.options ?? []}
          onChange={(newValue) => onChange(field.name, newValue)}
        />
      );

    default:
      return null;
  }
}
