type FeatureItemProps = {
  title?: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor?: string;
};

export function FeatureItem({
  title,
  description,
  icon,
  iconBgColor,
}: FeatureItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        {title && <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>}
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
