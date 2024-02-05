import Image from "next/image";

import styles from "./StackIcon.module.css";

export default function StackIcon({
  text,
  icon,
}: {
  text: string;
  icon?: string;
}) {
  if (!icon) return <div className={styles.wrapper} />;

  return (
    <div className={styles.wrapper}>
      <Image
        src={`/images/lib/stacks/${icon}`}
        width={48}
        height={48}
        alt={text}
      />
      <span>{text}</span>
    </div>
  );
}
