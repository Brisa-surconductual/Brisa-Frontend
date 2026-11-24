import { useEffect, useRef, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { descartarIntervencionSos } from '../../services/sos/intervencionSosActual.js';

import { abrirSos, activarDesdeClick, esRutaSos } from './abrirSos.js';
import {
  SOS_BUTTON_CLASS,
  SOS_BUTTON_HINT,
  SOS_BUTTON_HINT_ID,
} from './sosButtonStyles.js';
import { useSosButtonPosition } from './useSosButtonPosition.js';

export const SOS_BUTTON_LABEL = 'Tengo ganas de vapear';
/*
 * RF-43: botón SOS global del estudiante. Se monta una sola vez en el
 * layout del estudiante (que solo existe bajo la guarda ESTUDIANTE). En
 * móvil flota sobre la barra inferior, sin taparla; desde tableta, en la
 * esquina. Dentro de la propia intervención no se muestra.
 * Un toque o clic activa el SOS; arrastrarlo (o las flechas) lo mueve sin
 * activarlo.
 */
export function SosButton() {
  const location = useLocation();
  const navigate = useNavigate();
  // Candado síncrono contra el doble toque antes de que React pinte.
  const tocadoRef = useRef(false);
  // Pantalla (location.key) en la que se tocó: el botón se ve deshabilitado
  // hasta que se abre la intervención.
  const [tocadoEn, setTocadoEn] = useState(null);
  const enSos = esRutaSos(location.pathname);
  const {
    botonRef,
    arrastrando,
    estilo,
    manejadores,
    consumirClickDeArrastre,
  } = useSosButtonPosition({ visible: !enSos });

  // Al desmontarse el layout (cierre de sesión) la intervención de esta
  // pestaña se descarta: no la ve otra cuenta.
  useEffect(() => () => descartarIntervencionSos(), []);

  // Al cambiar de pantalla el botón vuelve a admitir un toque.
  useEffect(() => {
    tocadoRef.current = false;
  }, [location.pathname]);

  if (enSos) return null;

  function handleClick() {
    activarDesdeClick({
      consumirClickDeArrastre,
      candadoRef: tocadoRef,
      activar: () => {
        setTocadoEn(location.key);
        abrirSos({ location, navigate });
      },
    });
  }

  const abriendo = tocadoEn !== null && tocadoEn === location.key;

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={handleClick}
        {...manejadores}
        disabled={abriendo}
        aria-busy={abriendo || undefined}
        aria-describedby={SOS_BUTTON_HINT_ID}
        data-arrastrando={arrastrando}
        style={estilo}
        className={SOS_BUTTON_CLASS}
      >
        <LifeBuoy
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
          className="shrink-0"
        />
        {/* En pantallas muy angostas el texto queda solo para el lector de
            pantalla: sigue siendo el nombre accesible del botón. */}
        <span className="max-[339px]:sr-only">{SOS_BUTTON_LABEL}</span>
      </button>
      <span id={SOS_BUTTON_HINT_ID} className="sr-only">
        {SOS_BUTTON_HINT}
      </span>
    </>
  );
}
