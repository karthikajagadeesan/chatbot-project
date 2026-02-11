import { AlertTriangleIcon } from "lucide-react";

export default function ErrorState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-1">
      <AlertTriangleIcon className="mb-3 text-red-500" size={64} />
      <h1 className="text-xl font-bold">{title}</h1>
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  );
}
