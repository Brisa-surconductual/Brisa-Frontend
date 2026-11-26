import { Component, Fragment } from 'react';
import { ArrowLeft } from 'lucide-react';

import { ApiErrorMessage } from '@/shared/components/ui/ApiErrorMessage/index.js';
import { Button } from '@/shared/components/ui/Button/index.js';
import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import {
  CODIGO_ERROR_CLIENTE,
  registrarErrorCliente,
} from '../../services/erroresCliente.js';

// ADR-0004 D2: sin mensaje del backend se usa el texto de DESCONOCIDO.
// «Reintentar» vuelve a montar la conversación, que se recarga del servidor.
const ERROR_PRESENTACION = Object.freeze({
  status: null,
  codigo: API_ERROR_CLIENTE.DESCONOCIDO,
  mensaje: '',
  campo: null,
  reintentable: true,
});

export const TEXTO_RESPUESTAS_CONSERVADAS =
  'Tus respuestas guardadas no se perdieron.';

/*
 * RF-37: límite de errores de la conversación. Un fallo al presentar el
 * chat no derriba la aplicación: se muestra un aviso y se puede recuperar
 * la interfaz o volver al chat. No borra nada: el estado vuelve a pedirse
 * al servidor. No muestra ni reporta el detalle técnico (solo el código
 * ERROR_PRESENTACION y la sesión). Los errores de las peticiones HTTP no
 * llegan aquí: los tratan el hook y los servicios.
 */
export class ChatErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false, intento: 0 };
    this.recuperar = this.recuperar.bind(this);
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch() {
    // Sin el error ni su stack: el contrato solo admite código y sesión.
    void registrarErrorCliente({
      codigo: CODIGO_ERROR_CLIENTE.ERROR_PRESENTACION,
      idSesion: this.props.idSesion ?? null,
    });
  }

  recuperar() {
    this.setState((previo) => ({ fallo: false, intento: previo.intento + 1 }));
  }

  render() {
    if (!this.state.fallo) {
      return (
        <Fragment key={this.state.intento}>{this.props.children}</Fragment>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-3)] py-[var(--space-6)]">
        <ApiErrorMessage error={ERROR_PRESENTACION} onRetry={this.recuperar} />

        <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          {TEXTO_RESPUESTAS_CONSERVADAS}
        </p>

        {this.props.onVolverAlChat && (
          <Button
            variant="secondary"
            size="large"
            onClick={this.props.onVolverAlChat}
            className="self-start"
          >
            <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
            Volver al chat
          </Button>
        )}
      </div>
    );
  }
}
