export default function EmptyState({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-2">
      <Icon className="text-4xl text-gray-500 mb-2" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
