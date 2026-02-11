import { Loader2 } from "lucide-react";

export default function LoadingState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-1">
      <Loader2 className="animate-spin mb-4" />
      <h1 className="text-md">{title}</h1>
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  );
}
