import { BrisaMark } from '../../../../components/BrisaMark/index.js';
import { LandingIcon } from '../../../../components/LandingIcon/index.js';

// Una escena animada por función, solo con formas CSS/SVG. Cada una anima
// únicamente transform y opacity (ver .lp-art en landing.css). Registro por
// id: agregar una función es agregar una entrada.

const dots = (n) => Array.from({ length: n }, (_, i) => i);

// Campos que se llenan uno a uno y una palomita que aparece al final.
function AccountArt() {
  return (
    <div className="lp-art lp-art--account">
      {dots(3).map((i) => (
        <span
          key={i}
          className="lp-art__field lp-anim"
          style={{ '--i': i }}
        />
      ))}
      <span className="lp-art__tick lp-anim">
        <LandingIcon
          name="ShieldCheck"
          size={18}
        />
      </span>
    </div>
  );
}

// Renglones que se escriben, uno tras otro.
function DiaryArt() {
  return (
    <div className="lp-art lp-art--diary">
      {dots(5).map((i) => (
        <span
          key={i}
          className="lp-art__line lp-anim"
          style={{ '--i': i }}
        />
      ))}
    </div>
  );
}

// Burbujas que aparecen turnándose.
function ChatArt() {
  return (
    <div className="lp-art lp-art--chat">
      <span className="lp-art__bubble lp-art__bubble--bot lp-anim" />
      <span className="lp-art__bubble lp-art__bubble--me lp-anim" />
      <span className="lp-art__bubble lp-art__bubble--bot lp-art__bubble--short lp-anim" />
    </div>
  );
}

// Casillas de semanas que se van abriendo.
function ScheduleArt() {
  return (
    <div className="lp-art lp-art--schedule">
      {dots(8).map((i) => (
        <span
          key={i}
          className="lp-art__cell lp-anim"
          style={{ '--i': i }}
        />
      ))}
    </div>
  );
}

// Barras que crecen.
function TrackingArt() {
  return (
    <div className="lp-art lp-art--tracking">
      {[35, 55, 45, 75, 65, 90].map((h, i) => (
        <span
          key={h}
          className="lp-art__bar lp-anim"
          style={{ '--i': i, '--h': `${h}%` }}
        />
      ))}
    </div>
  );
}

// El logo viaja por un camino con estrellas.
function StoryArt() {
  return (
    <div className="lp-art lp-art--story">
      <span className="lp-art__trail" />
      <span className="lp-art__walker lp-anim">
        <BrisaMark
          size={36}
          animated
        />
      </span>
      <span className="lp-art__star lp-anim" />
    </div>
  );
}

// Campana que suena con un aviso que aparece.
function ReminderArt() {
  return (
    <div className="lp-art lp-art--reminder">
      <span className="lp-art__bell lp-anim">
        <LandingIcon
          name="BellRing"
          size={28}
        />
      </span>
      <span className="lp-art__ping lp-anim" />
    </div>
  );
}

// Un escudo con ondas que laten.
function SupportArt() {
  return (
    <div className="lp-art lp-art--support">
      {dots(3).map((i) => (
        <span
          key={i}
          className="lp-art__wave lp-anim"
          style={{ '--i': i }}
        />
      ))}
      <span className="lp-art__shield">
        <LandingIcon
          name="ShieldCheck"
          size={26}
        />
      </span>
    </div>
  );
}

const ART = Object.freeze({
  cuenta: AccountArt,
  diario: DiaryArt,
  chat: ChatArt,
  cronograma: ScheduleArt,
  seguimiento: TrackingArt,
  historia: StoryArt,
  recordatorios: ReminderArt,
  apoyo: SupportArt,
});

export function FeatureArt({ id }) {
  const Art = ART[id];

  return Art ? <Art /> : null;
}
