import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ArrowCounterClockwise, ArrowRight, Bank, Check, Clock, Coins, FlowerLotus, Gauge, Info, Leaf, Receipt, ShieldCheck, Sparkle, UsersThree } from "@phosphor-icons/react";
import { assertAccountingIdentity, calculateAnnualProjection, calculateBreakEvenOrders, calculateSummary, cloneLedger } from "./accounting";
import { orders, screens, stepKeys } from "./gameData";
import i18n from "./i18n";

const formatMoney = (value) => new Intl.NumberFormat(i18n.resolvedLanguage === "en" ? "en-HK" : "zh-HK", { style: "currency", currency: "HKD", maximumFractionDigits: 0 }).format(value);
const assetPath = (filename) => `${import.meta.env.BASE_URL}assets/${filename}`;
const INITIAL_META = { energy: 100, craft: 72, inheritance: 0, satisfaction: 70, safety: 72 };

function playInterfaceTone(kind, enabled) {
  if (!enabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencies = { select: 330, success: 520, warning: 180, reveal: 260 };
  oscillator.frequency.value = frequencies[kind] ?? 330;
  oscillator.type = kind === "warning" ? "triangle" : "sine";
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
  oscillator.addEventListener("ended", () => context.close());
}

function applyEffects(previous, effects) {
  const ledger = cloneLedger(previous.ledger);
  if (effects.basePrice !== undefined) { ledger.contract.basePrice = effects.basePrice; ledger.contract.depositReceived = effects.basePrice * .5; }
  ledger.contract.approvedChangeFees += effects.changeFees ?? 0;
  ledger.directCosts.materials += effects.materials ?? 0;
  ledger.directCosts.externalLabour += effects.externalLabour ?? 0;
  ledger.directCosts.logistics += effects.logistics ?? 0;
  ledger.masterLabour.hours += effects.masterHours ?? 0;
  ledger.overhead.orderWorkshopHours += effects.workshopHours ?? 0;
  const change = (key) => Math.max(0, Math.min(100, previous.meta[key] + (effects[key] ?? 0)));
  return { ledger, meta: { energy: change("energy"), craft: change("craft"), inheritance: change("inheritance"), satisfaction: change("satisfaction"), safety: change("safety") } };
}

function describeEffects(effects, t) {
  const changes = [];
  const addMoney = (label, value) => value && changes.push({ label, value: `${value > 0 ? "+" : "−"}${formatMoney(Math.abs(value))}`, tone: value > 0 ? "cost" : "benefit" });
  const addNumber = (label, value, suffix = "") => value && changes.push({ label, value: `${value > 0 ? "+" : ""}${value}${suffix}`, tone: value > 0 ? "cost" : "benefit" });
  if (effects.basePrice !== undefined) changes.push({ label: t("effects.customerPays"), value: formatMoney(effects.basePrice), tone: "neutral" });
  addMoney(t("effects.newRevenue"), effects.changeFees); addMoney(t("effects.materials"), effects.materials); addMoney(t("effects.externalLabour"), effects.externalLabour); addMoney(t("effects.logistics"), effects.logistics);
  addNumber(t("effects.masterHours"), effects.masterHours, ` ${t("metrics.hourUnit")}`); addNumber(t("effects.workshopHours"), effects.workshopHours, ` ${t("metrics.hourUnit")}`);
  for (const [key, label] of [["energy", "effects.energy"], ["craft", "effects.craft"], ["inheritance", "effects.inheritance"], ["satisfaction", "effects.satisfaction"], ["safety", "effects.safety"]]) addNumber(t(label), effects[key], ` ${t("effects.points")}`);
  return changes.length ? changes : [{ label: t("effects.ledger"), value: t("effects.baseline"), tone: "neutral" }];
}

function Metric({ icon: Icon, label, value, rose = false }) {
  return <div className={`metric ${rose ? "rose" : ""}`}><Icon size={21} weight="light" /><span>{label}</span><strong>{value}</strong></div>;
}

function Header({ state, step, soundEnabled, onToggleSound, t }) {
  const s = calculateSummary(state.ledger);
  return <><header className="topbar"><div className="brand"><FlowerLotus size={22} weight="light" /> {t("brand")}</div>{step > 0 ? <div className="topbar-metrics"><Metric icon={Coins} label={t("metrics.cash")} value={formatMoney(s.availableCash)} /><Metric icon={Clock} label={t("metrics.hours")} value={`${state.ledger.masterLabour.hours} ${t("metrics.hourUnit")}`} /><Metric icon={Gauge} label={t("metrics.energy")} value={`${state.meta.energy}/100`} rose /><Metric icon={Sparkle} label={t("metrics.craft")} value={`${state.meta.craft}/100`} />{state.meta.inheritance > 0 ? <Metric icon={Leaf} label={t("metrics.inheritance")} value={`${state.meta.inheritance}/100`} /> : null}</div> : <span className="choose-prompt">{t("header.choose")}</span>}<div className="header-controls"><label className="language-select"><span>{t("language.label")}</span><select value={i18n.resolvedLanguage} onChange={(event) => i18n.changeLanguage(event.target.value)}><option value="zh">{t("language.zh")}</option><option value="en">{t("language.en")}</option></select></label><button className="sound-toggle" aria-pressed={soundEnabled} onClick={onToggleSound}>{soundEnabled ? t("sound.on") : t("sound.off")}</button></div></header><nav className="progress-nav" aria-label={t("header.progress")}>{stepKeys.map((key, index) => <div className={`progress-step ${index <= step ? "active" : ""}`} key={key}><span>{String(index + 1).padStart(2, "0")}</span><small>{t(`steps.${key}`)}</small></div>)}</nav></>;
}

function OrderSelect({ onSelect, t }) {
  return <section className="order-select type-reveal"><div className="order-select-intro"><p className="kicker">{t("home.kicker")}</p><h1>{t("home.title").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1><p className="lede">{t("home.lede")}</p></div><div className="order-card-list">{orders.map((order) => <button className="order-card" key={order.id} onClick={() => onSelect(order)}><span className="order-level">{t(`orders.${order.id}.level`)}</span><strong>{t(`orders.${order.id}.title`)}</strong><span className="order-price">{t("home.budget")} {formatMoney(order.price)}</span><span className="order-spec">{t("home.spec", { size: order.size, days: order.days })}</span><p>{t(`orders.${order.id}.description`)}</p><span className="order-cta">{t("home.cta")} <ArrowRight /></span></button>)}</div><div className="notice order-disclaimer"><Info size={19} />{t("home.disclaimer")}</div></section>;
}

function createQuoteScreen(order) {
  const lowPrice = order.price - Math.round(order.price * .125 / 1000) * 1000;
  const premiumPrice = order.price + Math.round(order.price * .165 / 1000) * 1000;
  return { ...screens[0], dynamicOrder: order, options: [{ key: "low", metaValue: lowPrice, effects: { basePrice: lowPrice, satisfaction: 8 } }, { key: "fair", metaValue: order.price, effects: { basePrice: order.price, satisfaction: 4 } }, { key: "craft", metaValue: premiumPrice, effects: { basePrice: premiumPrice, materials: Math.round(order.materials * .17), masterHours: Math.round(order.masterHours * .14), craft: 10 } }] };
}

function Decision({ screen, selected, onSelect, onNext, t }) {
  const prefix = `screens.${screen.key}`;
  const body = screen.dynamicOrder ? t("decision.quoteBody", { title: t(`orders.${screen.dynamicOrder.id}.title`), size: screen.dynamicOrder.size, days: screen.dynamicOrder.days }) : t(`${prefix}.body`);
  return <section className="decision-screen type-reveal"><div className="decision-intro"><p className="kicker">{t(`${prefix}.eyebrow`)}</p><h2>{t(`${prefix}.title`)}</h2><p>{body}</p></div><div className="option-list" role="radiogroup" aria-label={t(`${prefix}.title`)}>{screen.options.map((option, index) => <button className={`option-row ${selected === index ? "selected" : ""}`} key={option.key} role="radio" aria-checked={selected === index} onClick={() => onSelect({ index, effects: option.effects })}><span className="radio-mark">{selected === index ? <Check size={14} weight="bold" /> : null}</span><span className="option-main"><strong>{t(`${prefix}.options.${option.key}.title`)}</strong><small>{t(`${prefix}.options.${option.key}.note`)}</small></span><span className="option-meta">{option.metaValue !== undefined ? formatMoney(option.metaValue) : t(`${prefix}.options.${option.key}.meta`)}</span></button>)}</div><button className="primary-action" disabled={selected === null} onClick={onNext}>{t("decision.confirm")} <ArrowRight /></button></section>;
}

function OutcomeScreen({ outcome, onContinue, soundEnabled, t }) {
  const changes = describeEffects(outcome.effects, t);
  useEffect(() => { playInterfaceTone(changes.some((change) => change.tone === "cost") ? "warning" : "reveal", soundEnabled); }, [outcome, soundEnabled]);
  return <section className="outcome-screen type-reveal"><div><p className="kicker">{t("outcome.kicker")}</p><h2>{t(`screens.${outcome.screenKey}.options.${outcome.optionKey}.title`)}</h2><p>{t("outcome.intro")}</p></div><div className="outcome-card">{changes.map((change, index) => <div className={`outcome-row ${change.tone}`} style={{ animationDelay: `${index * 90}ms` }} key={`${change.label}-${change.value}`}><span>{change.label}</span><strong>{change.value}</strong></div>)}<p className="outcome-note">{t("outcome.note")}</p><button className="primary-action" onClick={onContinue}>{t("outcome.continue")} <ArrowRight /></button></div></section>;
}

const labourChallenges = {
  4: {
    key: "bamboo",
    actions: [
      { image: "bamboo-step-align.jpg" }, { image: "bamboo-step-wrap.jpg" }, { image: "bamboo-step-tighten.jpg" }, { image: "bamboo-step-check.jpg" }
    ],
  },
  6: {
    key: "carry",
    actions: [
      { image: "carry-dragon-column.jpg" }, { image: "carry-phoenix-top.jpg" }, { image: "carry-signboard.jpg" }, { image: "carry-left-frame.jpg" }, { image: "carry-right-frame.jpg" }, { image: "carry-lighting-rig.jpg" }
    ],
  },
};

function LabourChallenge({ challenge, onComplete, onMistake, soundEnabled, t }) {
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const labels = t(`labour.${challenge.key}.actions`, { returnObjects: true });
  const actions = challenge.actions.map((action, index) => ({ ...action, label: labels[index] }));
  const displayOrder = actions.length === 4 ? [2, 0, 3, 1] : [2, 5, 0, 4, 1, 3];
  const displayedActions = displayOrder.map((index) => ({ ...actions[index], originalIndex: index }));
  const finished = progress >= actions.length;
  const chooseAction = (index) => {
    if (index !== progress) { setMistakes((value) => value + 1); setFeedback(t("labour.wrong", { chosen: actions[index].label, expected: actions[progress].label })); onMistake(); playInterfaceTone("warning", soundEnabled); return; }
    setFeedback(t("labour.correct", { action: actions[index].label }));
    playInterfaceTone(progress === actions.length - 1 ? "success" : "select", soundEnabled);
    setProgress((value) => Math.min(actions.length, value + 1));
  };
  return <section className="labour-game type-reveal">
    <div className="labour-copy"><p className="kicker">{t(`labour.${challenge.key}.kicker`)}</p><h2>{t(`labour.${challenge.key}.title`)}</h2><p>{t(`labour.${challenge.key}.body`)}</p>{!finished ? <div className="current-task"><small>{t("labour.current")}</small><strong>{actions[progress].label}</strong></div> : null}<div className="labour-progress"><span style={{ width: `${progress / actions.length * 100}%` }} /></div><strong className="labour-count">{progress} / {actions.length}</strong>{mistakes ? <small className="mistake-count">{t("labour.mistakes", { count: mistakes })}</small> : null}</div>
    <div className={`labour-board ${challenge.actions ? "has-images" : ""} ${finished ? "finished" : ""}`}>
      {displayedActions.map((action) => <button key={action.label} className={`labour-target ${action.image ? "image-target" : ""} ${action.originalIndex < progress ? "done" : ""}`} disabled={finished || action.originalIndex < progress} onClick={() => chooseAction(action.originalIndex)}>
        {action.image ? <img src={assetPath(action.image)} alt="" /> : null}
        <span className="target-status">{action.originalIndex < progress ? <Check weight="bold" /> : "?"}</span>
        <strong className="target-label">{action.label}</strong>
      </button>)}
    </div>
    {finished ? <div className="labour-reflection"><p>{t(`labour.${challenge.key}.completion`)}</p><p>{t("labour.operations", { count: mistakes + actions.length })}</p><button className="primary-action" onClick={onComplete}>{t("labour.continue")} <ArrowRight /></button></div> : <p className={`labour-hint ${feedback ? "wrong" : ""}`}>{feedback || t("labour.hint")}</p>}
  </section>;
}

function ModalShell({ children, className = "", onClose, labelId, closeLabel }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector("button")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const controls = [...dialog.querySelectorAll("button:not(:disabled)")];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus?.(); };
  }, [onClose]);
  return createPortal(<div className={`modal-backdrop ${className}`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className={className.includes("apprentice") ? "apprentice-modal" : "reflection-modal"} role="dialog" aria-modal="true" aria-labelledby={labelId}>{children}<button className="modal-close" aria-label={closeLabel} onClick={onClose}>×</button></div></div>, document.body);
}

function ReflectionModal({ onClose }) {
  const { t } = useTranslation();
  const questions = t("reflection.questions", { returnObjects: true });
  const answerOptions = t("reflection.answers", { returnObjects: true });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const complete = index >= questions.length;
  const answer = (value) => { setAnswers((items) => [...items, value]); setIndex((valueIndex) => valueIndex + 1); };
  return <ModalShell onClose={onClose} labelId="reflection-title" closeLabel={t("common.close")}>
    {!complete ? <><p className="kicker">{t("reflection.kicker", { current: index + 1 })}</p><h2 id="reflection-title">{questions[index]}</h2><div className="reflection-actions">{answerOptions.map((label) => <button key={label} onClick={() => answer(label)}>{label}</button>)}</div><p className="reflection-note">{t("reflection.note")}</p></> : <><p className="kicker">{t("reflection.summaryKicker")}</p><h2 id="reflection-title">{t("reflection.summaryTitle")}</h2><div className="answer-summary">{answers.map((value, answerIndex) => <span key={`${value}-${answerIndex}`}>{t("reflection.answer", { number: answerIndex + 1, value })}</span>)}</div><p>{t("reflection.summary")}</p><button className="primary-action" onClick={onClose}>{t("reflection.back")}</button></>}
  </ModalShell>;
}

const apprenticeQuestions = [
  { options: [{ effects: { days: 12, energy: -20 } }, { effects: { days: 8, energy: -8 } }] },
  { options: [{ effects: { nightHours: 12, allowance: 600, energy: -20 } }, { effects: { nightHours: 0, allowance: 0, energy: 0 } }] },
  { options: [{ effects: { trainingHours: 16, skill: 16 } }, { effects: { trainingHours: 0, skill: 4 } }] },
];

function ApprenticeMonth({ onClose }) {
  const { t } = useTranslation();
  const questions = t("apprentice.questions", { returnObjects: true });
  const optionLabels = t("apprentice.options", { returnObjects: true });
  const [index, setIndex] = useState(0);
  const [month, setMonth] = useState({ days: 0, nightHours: 0, trainingHours: 0, allowance: 0, energy: 100, skill: 0 });
  const choose = (effects) => { setMonth((value) => ({ ...value, ...effects, energy: Math.max(0, value.energy + (effects.energy ?? 0)), skill: value.skill + (effects.skill ?? 0) })); setIndex((value) => value + 1); };
  const complete = index >= apprenticeQuestions.length;
  const wages = month.days * 650 + month.allowance;
  const hours = month.days * 10 + month.nightHours + month.trainingHours;
  const livingCosts = 8500;
  return <ModalShell onClose={onClose} labelId="apprentice-title" className="apprentice-backdrop" closeLabel={t("common.close")}>
    {!complete ? <><p className="kicker">{t("apprentice.kicker", { current: index + 1 })}</p><h2 id="apprentice-title">{questions[index]}</h2><div className="apprentice-options">{apprenticeQuestions[index].options.map((option, optionIndex) => <button key={optionIndex} onClick={() => choose(option.effects)}>{optionLabels[index][optionIndex]}<ArrowRight /></button>)}</div><div className="apprentice-live"><span>{t("apprentice.dayRate")} <b>HK$650</b></span><span>{t("apprentice.workDays")} <b>{t("apprentice.days12")}</b></span><span>{t("apprentice.energy")} <b>{month.energy}/100</b></span></div></> : <><p className="kicker">{t("apprentice.resultKicker")}</p><h2 id="apprentice-title">{t("apprentice.resultTitle")}</h2><div className="apprentice-ledger"><div><span>{t("apprentice.wages")}</span><strong>{formatMoney(wages)}</strong></div><div><span>{t("apprentice.hours")}</span><strong>{hours} {t("metrics.hourUnit")}</strong></div><div><span>{t("apprentice.hourly")}</span><strong>{hours ? formatMoney(wages / hours) : "—"}</strong></div><div><span>{t("apprentice.living")}</span><strong>−{formatMoney(livingCosts)}</strong></div><div className="apprentice-balance"><span>{t("apprentice.balance")}</span><strong>{formatMoney(wages - livingCosts)}</strong></div></div><p className="annual-caveat">{t("apprentice.caveat")}</p><button className="primary-action" onClick={onClose}>{t("apprentice.back")}</button></>}
  </ModalShell>;
}

function Settlement({ state, history, onRestart, soundEnabled }) {
  const { t } = useTranslation();
  const [reveal, setReveal] = useState(0);
  const [endingStage, setEndingStage] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showApprentice, setShowApprentice] = useState(false);
  const s = calculateSummary(state.ledger);
  const rowLabels = t("settlement.rows", { returnObjects: true, hours: state.ledger.masterLabour.hours });
  const rows = [[rowLabels[0], s.revenue, "income"], [rowLabels[1], -s.directCosts, "cost"], [rowLabels[2], s.operatingSurplus, "subtotal"], [rowLabels[3], -s.masterLabourCost, "cost"], [rowLabels[4], -s.allocatedOverhead, "cost"], [rowLabels[5], s.economicProfit, "profit"]];
  const tags = [t(s.economicProfit < 0 ? "tags.loss" : s.economicProfit < 8000 ? "tags.thin" : "tags.profit"), t(state.meta.energy < 35 ? "tags.overwork" : "tags.rest"), t(state.meta.craft >= 82 ? "tags.craft" : state.meta.craft < 65 ? "tags.simplified" : "tags.hybrid"), t(state.meta.inheritance > 0 ? "tags.inheritance" : "tags.noApprentice")];
  const annual = calculateAnnualProjection(state.ledger, 12);
  const breakEven = calculateBreakEvenOrders(state.ledger);
  return <section className="settlement type-reveal">
    <div className="settlement-title"><p className="kicker">{t("settlement.kicker")}</p><h2>{t("settlement.title").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h2><p>{t("settlement.intro", { amount: formatMoney(s.accountsReceivable) })}</p></div>
    <div className="ledger-reveal">{rows.slice(0, reveal + 2).map(([label, value, type], index) => <div className={`ledger-row ${type} ${index === reveal + 1 ? "new-ledger-row" : ""}`} key={label}><span>{label}</span><strong>{value < 0 ? "−" : ""}{formatMoney(Math.abs(value))}</strong></div>)}{reveal < 4 ? <button className="reveal-button" onClick={() => { playInterfaceTone("reveal", soundEnabled); setReveal((v) => v + 1); }}>{t("settlement.reveal")} <ArrowRight /></button> : <div className="result-block"><div><small>{t("settlement.margin")}</small><strong>{(s.economicProfitMargin * 100).toFixed(1)}%</strong></div><div><small>{t("settlement.identity")}</small><strong className="verified"><ShieldCheck /> {t("settlement.checked")}</strong></div></div>}</div>
    {reveal >= 4 ? <div className={`ending-panel ending-stage-${endingStage}`}>
      <div className="ending-stage-nav">{t("settlement.stages", { returnObjects: true }).map((label, index) => <span className={endingStage === index ? "active" : ""} key={label}>{label}</span>)}</div>
      {endingStage === 0 ? <div className="ending-scene crisis-reveal"><div className="ending-summary"><p className="kicker">{t("settlement.ending.kicker")}</p><h3>{t(s.economicProfit < 0 ? "settlement.ending.loss" : s.economicProfit < 8000 ? "settlement.ending.thin" : "settlement.ending.profit")}</h3><div className="tag-row">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button className="primary-action" onClick={() => setEndingStage(1)}>{t("settlement.ending.nextAnnual")} <ArrowRight /></button></div> : null}
      {endingStage === 1 ? <div className="ending-scene type-reveal"><div className="annual-breakdown"><p className="kicker">{t("settlement.annual.kicker")}</p><div><span>{t("settlement.annual.revenue")}</span><strong>{formatMoney(annual.revenue)}</strong></div><div><span>{t("settlement.annual.direct")}</span><strong>−{formatMoney(annual.directCosts)}</strong></div><div><span>{t("settlement.annual.labour")}</span><strong>−{formatMoney(annual.masterLabourCost)}</strong></div><div><span>{t("settlement.annual.fixed")}</span><strong>−{formatMoney(annual.fixedCosts)}</strong></div><div className="annual-total"><span>{t("settlement.annual.result")}</span><strong>{formatMoney(annual.economicProfit)}</strong></div></div><div className="break-even"><div><small>{t("settlement.annual.contribution")}</small><strong>{formatMoney(breakEven.contributionPerOrder)}</strong><p>{t("settlement.annual.formula")}</p></div><div><small>{t("settlement.annual.breakEven")}</small><strong>{breakEven.orders ? t("settlement.annual.orders", { count: breakEven.orders }) : t("settlement.annual.impossible")}</strong><p>{breakEven.orders ? t("settlement.annual.monthly", { count: (breakEven.orders / 12).toFixed(1) }) : t("settlement.annual.impossibleNote")}</p></div></div><p className="annual-caveat">{t("settlement.annual.caveat")}</p><button className="primary-action" onClick={() => setEndingStage(2)}>{t("settlement.ending.nextHistory")} <ArrowRight /></button></div> : null}
      {endingStage === 2 ? <div className="ending-scene type-reveal"><div className="choice-timeline"><p className="kicker">{t("settlement.history")}</p>{history.map((item, index) => <div key={`${item.screenKey}-${item.optionKey}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{t(`screens.${item.screenKey}.options.${item.optionKey}.title`)}</strong><small>{describeEffects(item.effects, t).map((change) => `${change.label} ${change.value}`).join(" · ")}</small></div>)}</div><div className="ending-actions"><button className="question-action" onClick={() => setShowApprentice(true)}>{t("settlement.apprentice")} <ArrowRight /></button><button className="question-action muted-action" onClick={() => setShowQuestions(true)}>{t("settlement.questions")}</button><button className="secondary-action" onClick={onRestart}><ArrowCounterClockwise /> {t("common.restart")}</button></div></div> : null}
    </div> : null}
    {showQuestions ? <ReflectionModal onClose={() => setShowQuestions(false)} /> : null}
    {showApprentice ? <ApprenticeMonth onClose={() => setShowApprentice(false)} /> : null}
  </section>;
}

export function App() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [state, setState] = useState({ ledger: cloneLedger(), meta: INITIAL_META });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [choice, setChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState({});
  const summary = useMemo(() => calculateSummary(state.ledger), [state.ledger]);
  const currentScreen = step === 1 && selectedOrder ? createQuoteScreen(selectedOrder) : screens[step - 1];
  const selectOrder = (order) => {
    const ledger = cloneLedger();
    ledger.contract.basePrice = order.price;
    ledger.contract.depositReceived = order.price * .5;
    ledger.directCosts.materials = order.materials;
    ledger.directCosts.externalLabour = order.externalLabour;
    ledger.directCosts.logistics = order.logistics;
    ledger.masterLabour.hours = order.masterHours;
    ledger.overhead.orderWorkshopHours = order.workshopHours;
    setSelectedOrder(order);
    setState({ ledger, meta: INITIAL_META });
    setStep(1);
  };
  const confirm = () => { if (!choice) return; const selectedOption = currentScreen.options[choice.index]; const record = { screenKey: currentScreen.key, optionKey: selectedOption.key, effects: choice.effects }; setState((current) => applyEffects(current, choice.effects)); setHistory((items) => [...items, record]); setOutcome(record); setChoice(null); };
  const continueOutcome = () => { setOutcome(null); setStep((s) => Math.min(7, s + 1)); };
  const restart = () => { setState({ ledger: cloneLedger(), meta: INITIAL_META }); setSelectedOrder(null); setChoice(null); setOutcome(null); setHistory([]); setCompletedChallenges({}); setStep(0); };
  const needsChallenge = labourChallenges[step] && !completedChallenges[step];
  const handleMistake = () => setState((current) => ({ ...current, meta: { ...current.meta, energy: Math.max(0, current.meta.energy - 1) } }));
  return <main className={`app-shell step-${step} ${state.meta.energy < 40 ? "low-energy" : ""}`}><div className="hero-photo" aria-hidden="true" /><Header state={state} step={step} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((value) => !value)} t={t} /><div className="screen-frame">{step === 0 ? <OrderSelect onSelect={selectOrder} t={t} /> : outcome ? <OutcomeScreen outcome={outcome} onContinue={continueOutcome} soundEnabled={soundEnabled} t={t} /> : step < 7 ? needsChallenge ? <LabourChallenge challenge={labourChallenges[step]} soundEnabled={soundEnabled} onMistake={handleMistake} onComplete={() => setCompletedChallenges((items) => ({ ...items, [step]: true }))} t={t} /> : <Decision screen={currentScreen} selected={choice?.index ?? null} onSelect={setChoice} onNext={confirm} t={t} /> : <Settlement state={state} history={history} soundEnabled={soundEnabled} onRestart={restart} />}</div><aside className="live-strip"><span><Receipt /> {selectedOrder ? t(`orders.${selectedOrder.id}.title`) : t("status.none")} <b>{selectedOrder ? formatMoney(summary.revenue) : "—"}</b></span><span><Bank /> {t("status.unpaid")} <b>{selectedOrder ? formatMoney(summary.accountsReceivable) : "—"}</b></span><span><UsersThree /> {t("status.explain")}</span><span className={assertAccountingIdentity(state.ledger) ? "ok" : "error"}><ShieldCheck /> {t("status.verified")}</span></aside></main>;
}
