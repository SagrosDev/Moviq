import type { StructuralFormItemKind } from "../../../entities/workflow";

export type FormDesignerItemType = "shortText" | StructuralFormItemKind;

type FormDesignerItemTypeIconProps = {
  kind: FormDesignerItemType;
};

export const FormDesignerItemTypeIcon = ({ kind }: FormDesignerItemTypeIconProps) => {
  if (kind === "shortText") {
    return (
      <svg aria-hidden="true" className="size-5 shrink-0" focusable="false" viewBox="0 0 24 24">
        <path d="M5 7h14M12 7v10M9 17h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
      </svg>
    );
  }
  if (kind === "section") {
    return (
      <svg aria-hidden="true" className="size-5 shrink-0" focusable="false" viewBox="0 0 24 24">
        <path d="M8 4H5v16h3M16 4h3v16h-3M9 9h6M9 13h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
      </svg>
    );
  }
  if (kind === "heading") {
    return (
      <svg aria-hidden="true" className="size-5 shrink-0" focusable="false" viewBox="0 0 24 24">
        <path d="M6 5v14M18 5v14M6 12h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
      </svg>
    );
  }
  if (kind === "instruction") {
    return (
      <svg aria-hidden="true" className="size-5 shrink-0" focusable="false" viewBox="0 0 24 24">
        <path d="M5 6h14M5 10h14M5 14h9M5 18h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="size-5 shrink-0" focusable="false" viewBox="0 0 24 24">
      <path d="M4 12h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    </svg>
  );
};
