"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";

type Locale = "en" | "ar";
const visualCopy = {
  en: {
    title: "IDEAS INTO MOTION",
    label: "A MORE HUMAN WAY TO LEARN",
    navigation: "CHANGE THE VIEW",
    stages: [
      { label: "DISCOVER", name: "Find the spark.", detail: "Every new skill starts with a question.", symbol: "✳" },
      { label: "LEARN", name: "Connect the dots.", detail: "One clear lesson leads to the next.", symbol: "↗" },
      { label: "BUILD", name: "Make it yours.", detail: "Put what you know into motion.", symbol: "⌘" },
    ],
  },
  ar: {
    title: "أفكار تتحوّل لواقع",
    label: "تجربة تعلّم أقرب إلك",
    navigation: "غيّر المرحلة",
    stages: [
      { label: "اكتشف", name: "ابدأ بالفضول.", detail: "كل مهارة جديدة بتبدأ بسؤال.", symbol: "✳" },
      { label: "تعلّم", name: "اربط الأفكار.", detail: "كل درس واضح بيوصلك للي بعده.", symbol: "↗" },
      { label: "طبّق", name: "خلّيها مهارتك.", detail: "حوّل اللي بتعرفه لشيء بتعمله.", symbol: "⌘" },
    ],
  },
};

export function HeroCanvas({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0);
  const visualRef = useRef<HTMLDivElement>(null);
  const t = visualCopy[locale];
  const current = t.stages[active];

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = visualRef.current;
    if (!element) return;
    const r = element.getBoundingClientRect();
    element.style.setProperty("--dx", `${((event.clientX - r.left) / r.width - .5) * 12}px`);
    element.style.setProperty("--dy", `${((event.clientY - r.top) / r.height - .5) * 12}px`);
  };

  const onLeave = () => {
    visualRef.current?.style.setProperty("--dx", "0px");
    visualRef.current?.style.setProperty("--dy", "0px");
  };

  return (
    <div ref={visualRef} className={styles.visualShell} onPointerMove={onPointerMove} onPointerLeave={onLeave} data-stage={active}>
      <div className={styles.heroPhoto} role="img" aria-label={locale === "ar" ? "فريق يتعاون في مساحة عمل وتعليم" : "A team learning and collaborating in a workspace"} />
      <span className={styles.heroPhotoIndex} aria-hidden="true">CRESTMARK — VISUAL NOTE 01</span>

      <div className={styles.floatStamp} aria-hidden="true">
        <Image
          src="/Logo.png"
          alt=""
          width={100}
          height={100}
          className={styles.floatStampLogo}
        />
      </div>
      <div className={styles.visualCard}>
        <div className={styles.visualCardTop}><span className={styles.visualPulse} />{t.label}<span>0{active + 1} / 03</span></div>
        <div className={styles.visualCardCenter} aria-live="polite">
          <span className={styles.visualSymbol} key={`symbol-${active}`}>{current.symbol}</span>
          <div key={`copy-${active}`}><small>{t.title}</small><strong>{current.name}</strong><p>{current.detail}</p></div>
        </div>
        <div className={styles.visualStagePicker} role="group" aria-label={t.navigation}>
          {t.stages.map((stage, i) => <button type="button" key={i} className={active === i ? styles.visualStageActive : ""} aria-pressed={active === i} onClick={() => setActive(i)}>{stage.label}</button>)}
        </div>
      </div>
      <div className={styles.verticalNote} aria-hidden="true">LEARN — MAKE — MOVE</div>
    </div>
  );
}

const consoleCopy = {
  en: {
    eyebrow: "INTERACTIVE / THREE CHAPTERS",
    chapters: [
      { title:"Discover", tag:"01 / ASK BETTER QUESTIONS", headline:"Start with what interests you.", text:"Explore subjects and choose a direction that feels worth pursuing.", keyword:"CURIOSITY", tasks:["Explore subjects", "Find a direction", "Choose your course"] },
      { title:"Learn", tag:"02 / MAKE IDEAS CLICK", headline:"Give every idea a place to land.", text:"Move through clear lessons, make connections, and build confidence at your own pace.", keyword:"CLARITY", tasks:["Follow lesson sections", "Return when you need", "Keep ideas connected"] },
      { title:"Progress", tag:"03 / KEEP GOING", headline:"See the distance you've covered.", text:"Follow completed lessons and move toward the next milestone when you're ready.", keyword:"MOMENTUM", tasks:["Track course progress", "Continue learning", "Reach eligible certificates"] },
    ],
    foot: "Illustrative learning journey — not live student metrics",
    button: "Explore available courses",
    pick: "SELECT A CHAPTER",
  },
  ar: {
    eyebrow: "تجربة تفاعلية / ثلاث مراحل",
    chapters: [
      { title:"اكتشف", tag:"01 / ابدأ بسؤال", headline:"ابدأ بالشي اللي بشدّك.", text:"استكشف المواضيع، واختَر الاتجاه اللي عندك رغبة فعلية تتعلّمه.", keyword:"الفضول", tasks:["استكشف المواضيع", "حدّد اتجاهك", "اختَر دورتك"] },
      { title:"تعلّم", tag:"02 / خلّي الأفكار واضحة", headline:"خلي كل فكرة بمكانها.", text:"انتقل بين دروس واضحة، واربط المعلومات ببعضها، وتعلّم على راحتك.", keyword:"الوضوح", tasks:["تابع أقسام الدورة", "ارجع للدروس وقت ما بدك", "اربط الأفكار"] },
      { title:"تقدّم", tag:"03 / كمّل رحلتك", headline:"شوف قديش قطعت من الطريق.", text:"تابع الدروس المكتملة وقرّب من إنجازك القادم بالوتيرة اللي بتناسبك.", keyword:"التقدّم", tasks:["تابع تقدّمك", "كمّل من آخر درس", "احصل على شهادة مؤهلة"] },
    ],
    foot: "تصوّر لرحلة التعلّم — ليس بيانات طلاب فعلية",
    button: "استكشف الدورات المتاحة",
    pick: "اختَر مرحلة",
  },
};

export function LearningConsole({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0);
  const t = consoleCopy[locale];
  const chapter = t.chapters[active];
  return (
    <div className={styles.consoleBoard} data-cm-reveal>
      <div className={styles.consoleRail}>
        <span className={styles.consoleRailTitle}>{t.eyebrow}</span>
        <div className={styles.consoleNavigation} role="group" aria-label={t.pick}>
          {t.chapters.map((item, i) => (
            <button key={i} type="button" className={active === i ? styles.consoleActive : ""} aria-pressed={active === i} onClick={() => setActive(i)}>
              <span>0{i + 1}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <span className={styles.consoleRailFooter}>CRESTMARK / YOU DECIDE THE PACE</span>
      </div>
      <div className={styles.consoleScreen}>
        <div className={styles.consoleScreenHead}><span>{chapter.tag}</span><span aria-hidden="true"><i /><i /><i /></span></div>
        <div className={styles.consoleScreenBody} key={active} aria-live="polite">
          <span className={styles.consoleWatermark} aria-hidden="true">0{active + 1}</span>
          <p className={styles.consoleKeyword}>{chapter.keyword}</p>
          <h3>{chapter.headline}</h3><p>{chapter.text}</p>
          <div className={styles.consoleChecklist}>{chapter.tasks.map((task, i) => <div key={i}><span aria-hidden="true">✳</span>{task}</div>)}</div>
        </div>
        <div className={styles.consoleBottom}><span>{t.foot}</span><Link href={`/${locale}/courses`}>{t.button} <span aria-hidden="true">↗</span></Link></div>
      </div>
    </div>
  );
}
