import Image from "next/image";

import StackIcon from "./StackIcon";
import styles from "./MySkills.module.css";

export default function MySkills({
  text,
  icon,
}: {
  text: string;
  icon: string;
}) {
  return (
    <div className={styles.wrapper}>
      <StackIcon text="html" icon="html.png" />
      <StackIcon text="css" icon="css.png" />
      <StackIcon text="javascript" icon="js.png" />
      <StackIcon text="typescript" icon="ts.png" />
      <StackIcon text="nodejs" icon="nodejs.png" />
      <StackIcon text="python" icon="py.png" />
      <StackIcon text="java" icon="java.png" />
      <StackIcon text="scss" icon="scss.png" />
      <StackIcon text="tailwind" icon="tw.png" />
      <StackIcon text="react" icon="react.png" />
      <StackIcon text="vue" icon="vue.png" />
      <StackIcon text="angular" icon="ng.png" />
      <StackIcon text="svelte" icon="svelte.png" />
      <StackIcon text="nextjs" icon="nextjs.png" />
      <StackIcon text="rxjs" icon="rxjs.png" />
      <StackIcon text="cypress" icon="cypress.png" />
      <StackIcon text="flutter" icon="flutter.png" />
      <StackIcon text="aws" icon="aws.png" />
      <StackIcon text="docker" icon="docker.png" />
      <StackIcon text="graphql" icon="graphql.png" />
      <StackIcon text="mysql" icon="mysql.png" />
      <StackIcon text="postgresql" icon="pg.png" />
      <StackIcon text="redis" icon="redis.png" />
      <StackIcon text="linux" icon="linux.png" />
      <StackIcon text="git" icon="git.png" />
      <StackIcon text="nginx" icon="nginx.png" />
      <StackIcon text="turporepo" icon="turporepo.png" />
      <StackIcon text="webpack" icon="webpack.png" />
      {/* placeholder */}
      <StackIcon text="" />
      <StackIcon text="" />
      <StackIcon text="" />
      <StackIcon text="" />
      <StackIcon text="" />
      <StackIcon text="" />
      <StackIcon text="" />
    </div>
  );
}
