import { NeoFitIcon, type NeoFitIconName } from '@/components/neofit-icons';

export function RoutePlaceholder({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: NeoFitIconName;
}) {
  return (
    <section className="page-stack placeholder-page" aria-labelledby="placeholder-heading">
      <span className="placeholder-page__icon"><NeoFitIcon name={icon} size={34} /></span>
      <p className="section-kicker">در حال انتقال</p>
      <h2 id="placeholder-heading">{title}</h2>
      <p>{description}</p>
    </section>
  );
}
