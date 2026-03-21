import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>{{projectName}}</h1>
      <p>Edit src/app/page.tsx and save to see changes.</p>
    </main>
  );
}
