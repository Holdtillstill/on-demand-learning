export function LabListSection({ items, title }: { items?: string[]; title: string }) {
  if (!items?.length) return null;
  return (
    <>
      <h2>{title}</h2>
      <ul className="check-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
