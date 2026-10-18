import {
  Children,
  isValidElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Select as Primitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value" | "defaultValue" | "multiple"
> & {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
};
/** Native option-shaped input, accessible Base UI popup and shared VERA tokens. */
export function Select({
  children,
  value,
  onChange,
  className,
  disabled,
  name,
  id,
  "aria-label": label,
}: Props) {
  const options: { value: string; label: ReactNode; disabled: boolean }[] = [];
  const collect = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (
        !isValidElement<{
          value?: string;
          disabled?: boolean;
          children?: ReactNode;
        }>(child)
      )
        return;
      if (child.type === "option")
        options.push({
          value: String(child.props.value ?? child.props.children ?? ""),
          label: child.props.children,
          disabled: !!child.props.disabled,
        });
      else collect(child.props.children);
    });
  collect(children);
  return (
    <Primitive.Root
      value={value}
      onValueChange={(next) => onChange({ target: { value: next ?? "" } })}
      items={options}
      disabled={disabled}
      name={name}
    >
      <Primitive.Trigger
        id={id}
        aria-label={label}
        className={cn(
          "inline-flex min-h-10 min-w-0 max-w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-text focus-visible:outline-2 focus-visible:outline-accent-red disabled:cursor-default disabled:opacity-50",
          className,
          "inline-flex",
        )}
      >
        <Primitive.Value className="min-w-0 flex-1 truncate" />
        <Primitive.Icon className="inline-flex shrink-0">
          <ChevronDown size={14} className="shrink-0" />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Positioner
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <Primitive.Popup className="max-h-80 min-w-48 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-border bg-background p-1.5 text-text shadow-lg outline-none">
            <Primitive.List>
              {options.map((option) => (
                <Primitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex min-h-9 cursor-default items-center justify-between gap-4 rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-surface data-disabled:opacity-40"
                >
                  <Primitive.ItemText className="min-w-0 break-words">
                    {option.label}
                  </Primitive.ItemText>
                  <Primitive.ItemIndicator>
                    <Check size={14} />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              ))}
            </Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
