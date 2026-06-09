import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface LineDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

export function LineItemsEditor({
  lines,
  onChange,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
}) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-3">
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => {
              const next = [...lines];
              next[i] = { ...next[i], description: e.target.value };
              onChange(next);
            }}
          />
          <Input
            placeholder="Qty"
            type="number"
            min="0.01"
            step="0.01"
            value={line.quantity}
            onChange={(e) => {
              const next = [...lines];
              next[i] = { ...next[i], quantity: e.target.value };
              onChange(next);
            }}
          />
          <Input
            placeholder="Unit price"
            type="number"
            min="0"
            step="0.01"
            value={line.unitPrice}
            onChange={(e) => {
              const next = [...lines];
              next[i] = { ...next[i], unitPrice: e.target.value };
              onChange(next);
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...lines, { description: '', quantity: '1', unitPrice: '' }])}
      >
        + Add line
      </Button>
    </div>
  );
}

export function parseLines(lines: LineDraft[]) {
  return lines
    .filter((l) => l.description && l.unitPrice)
    .map((l) => ({
      description: l.description,
      quantity: parseFloat(l.quantity) || 1,
      unitPrice: parseFloat(l.unitPrice) || 0,
    }));
}
