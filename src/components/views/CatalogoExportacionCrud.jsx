import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import api from "../../services/api";

const obtenerMensajeApi = (error, mensajePorDefecto) => {
  const datos = error?.response?.data;

  if (typeof datos === "string" && datos.trim()) {
    return datos;
  }

  return datos?.message || datos?.error || mensajePorDefecto;
};

const crearRegistroVacio = () => ({
  id: null,
  codigo: "",
  descripcion: "",
});

export default function CatalogoExportacionCrud({ catalogo }) {
  const [registros, setRegistros] = useState([]);
  const [registro, setRegistro] = useState(crearRegistroVacio);
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const toast = useRef(null);

  const mostrarToast = useCallback((configuracion) => {
    toast.current?.show(configuracion);
  }, []);

  const cargarRegistros = useCallback(
    async (signal) => {
      setCargando(true);

      try {
        const respuesta = await api.get(catalogo.endpoint, { signal });
        setRegistros(Array.isArray(respuesta.data) ? respuesta.data : []);
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return;
        }

        console.error(`Error al cargar ${catalogo.nombre}:`, error);
        mostrarToast({
          severity: "error",
          summary: "Error de carga",
          detail: obtenerMensajeApi(
            error,
            `No se pudieron cargar los registros de ${catalogo.nombre}.`
          ),
          life: 4000,
        });
      } finally {
        if (!signal?.aborted) {
          setCargando(false);
        }
      }
    },
    [catalogo.endpoint, catalogo.nombre, mostrarToast]
  );

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        cargarRegistros(controller.signal);
      }
    });

    return () => controller.abort();
  }, [cargarRegistros]);

  const abrirNuevo = () => {
    setRegistro(crearRegistroVacio());
    setDialogoVisible(true);
  };

  const editarRegistro = (registroSeleccionado) => {
    setRegistro({
      id: registroSeleccionado.id,
      codigo: registroSeleccionado.codigo ?? "",
      descripcion: registroSeleccionado.descripcion ?? "",
    });
    setDialogoVisible(true);
  };

  const confirmarEliminar = (registroSeleccionado) => {
    setRegistro(registroSeleccionado);
    setDialogoEliminarVisible(true);
  };

  const validarFormulario = () => {
    const codigoVacio = catalogo.codigoNumerico
      ? registro.codigo === null || registro.codigo === "" || registro.codigo === undefined
      : !String(registro.codigo ?? "").trim();

    if (codigoVacio || !String(registro.descripcion ?? "").trim()) {
      mostrarToast({
        severity: "warn",
        summary: "Campos obligatorios",
        detail: "Complete el código y la descripción del catálogo.",
        life: 3000,
      });
      return false;
    }

    if (
      catalogo.codigoNumerico &&
      !Number.isInteger(Number(registro.codigo))
    ) {
      mostrarToast({
        severity: "warn",
        summary: "Código inválido",
        detail: "El código debe ser un número entero.",
        life: 3000,
      });
      return false;
    }

    if (
      !catalogo.codigoNumerico &&
      String(registro.codigo).trim().length > catalogo.maxLength
    ) {
      mostrarToast({
        severity: "warn",
        summary: "Código demasiado largo",
        detail: `El código admite como máximo ${catalogo.maxLength} caracteres.`,
        life: 3000,
      });
      return false;
    }

    return true;
  };

  const guardarRegistro = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);

    const payload = {
      codigo: catalogo.codigoNumerico
        ? Number(registro.codigo)
        : String(registro.codigo).trim(),
      descripcion: String(registro.descripcion).trim(),
    };

    try {
      if (registro.id !== null && registro.id !== undefined) {
        await api.put(`${catalogo.endpoint}/${registro.id}`, payload);
        mostrarToast({
          severity: "success",
          summary: "Registro actualizado",
          detail: `${catalogo.nombre} actualizado correctamente.`,
          life: 3000,
        });
      } else {
        await api.post(catalogo.endpoint, payload);
        mostrarToast({
          severity: "success",
          summary: "Registro creado",
          detail: `${catalogo.nombre} creado correctamente.`,
          life: 3000,
        });
      }

      setDialogoVisible(false);
      setRegistro(crearRegistroVacio());
      await cargarRegistros();
    } catch (error) {
      console.error(`Error al guardar ${catalogo.nombre}:`, error);
      mostrarToast({
        severity: "error",
        summary: "No se pudo guardar",
        detail: obtenerMensajeApi(
          error,
          `No se pudo guardar el registro de ${catalogo.nombre}.`
        ),
        life: 4500,
      });
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRegistro = async () => {
    if (registro.id === null || registro.id === undefined) return;

    setEliminando(true);

    try {
      await api.delete(`${catalogo.endpoint}/${registro.id}`);
      mostrarToast({
        severity: "success",
        summary: "Registro eliminado",
        detail: `${catalogo.nombre} eliminado correctamente.`,
        life: 3000,
      });
      setDialogoEliminarVisible(false);
      setRegistro(crearRegistroVacio());
      await cargarRegistros();
    } catch (error) {
      console.error(`Error al eliminar ${catalogo.nombre}:`, error);
      mostrarToast({
        severity: "error",
        summary: "No se pudo eliminar",
        detail: obtenerMensajeApi(
          error,
          `No se pudo eliminar el registro de ${catalogo.nombre}.`
        ),
        life: 4500,
      });
    } finally {
      setEliminando(false);
    }
  };

  const plantillaCodigo = (fila) => (
    <span className="font-monospace font-semibold">
      {fila.codigo ?? "—"}
    </span>
  );

  const plantillaAcciones = (fila) => (
    <div className="flex gap-2">
      <Button
        type="button"
        icon="pi pi-pencil"
        className="p-button-rounded p-button-success p-button-sm"
        onClick={() => editarRegistro(fila)}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
        aria-label={`Editar ${catalogo.nombre}`}
      />
      <Button
        type="button"
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-sm"
        onClick={() => confirmarEliminar(fila)}
        tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
        aria-label={`Eliminar ${catalogo.nombre}`}
      />
    </div>
  );

  const encabezadoTabla = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div>
        <h3 className="m-0 text-lg" style={{ color: "var(--text-primary)" }}>
          Registros de {catalogo.nombre}
        </h3>
        <p className="m-0 mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Administre el código y la descripción utilizados por el DTE de exportación.
        </p>
      </div>
      <IconField iconPosition="left" className="w-full md:w-18rem">
        <InputIcon className="pi pi-search" />
        <InputText
          value={filtroGlobal}
          onChange={(evento) => setFiltroGlobal(evento.target.value)}
          placeholder="Buscar registros..."
          className="w-full"
          aria-label={`Buscar en ${catalogo.nombre}`}
        />
      </IconField>
    </div>
  );

  const pieDialogo = (
    <div className="flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={() => setDialogoVisible(false)}
        disabled={guardando}
      />
      <Button
        type="button"
        label={registro.id !== null ? "Actualizar" : "Guardar"}
        icon="pi pi-check"
        className="premium-btn"
        onClick={guardarRegistro}
        loading={guardando}
      />
    </div>
  );

  const pieDialogoEliminar = (
    <div className="flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={() => setDialogoEliminarVisible(false)}
        disabled={eliminando}
      />
      <Button
        type="button"
        label="Sí, eliminar"
        icon="pi pi-trash"
        className="p-button-danger premium-btn"
        onClick={eliminarRegistro}
        loading={eliminando}
      />
    </div>
  );

  return (
    <section className="premium-surface-card catalogo-exportacion-crud">
      <Toast ref={toast} />

      <div className="p-4 border-bottom-1" style={{ borderColor: "var(--surface-border-light)" }}>
        <div className="flex flex-column sm:flex-row sm:justify-content-between sm:align-items-center gap-3">
          <div className="flex align-items-center gap-3 min-w-0">
            <div className="catalogo-exportacion-crud__icon">
              <i className={`${catalogo.icono} text-xl`} />
            </div>
            <div className="min-w-0">
              <span className="premium-label">{catalogo.cat}</span>
              <h2 className="m-0 mt-1 text-2xl" style={{ color: "var(--text-primary)" }}>
                {catalogo.nombre}
              </h2>
            </div>
          </div>
          <Button
            type="button"
            label={`Nuevo ${catalogo.nombreSingular}`}
            icon="pi pi-plus"
            className="premium-btn w-full sm:w-auto"
            onClick={abrirNuevo}
          />
        </div>
      </div>

      <div className="p-4">
        <DataTable
          value={registros}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={cargando}
          globalFilter={filtroGlobal}
          globalFilterFields={["codigo", "descripcion"]}
          header={encabezadoTabla}
          emptyMessage={`No hay registros de ${catalogo.nombre}.`}
          responsiveLayout="scroll"
          className="premium-table"
          sortField="codigo"
          sortOrder={1}
        >
          <Column
            field="codigo"
            header="Código"
            body={plantillaCodigo}
            sortable
            style={{ width: "25%" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ width: "55%" }}
          />
          <Column
            header="Acciones"
            body={plantillaAcciones}
            exportable={false}
            style={{ width: "20%", minWidth: "8rem" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: "500px", maxWidth: "94vw" }}
        header={registro.id !== null ? `Editar ${catalogo.nombre}` : `Nuevo ${catalogo.nombre}`}
        modal
        className="p-fluid"
        footer={pieDialogo}
        onHide={() => setDialogoVisible(false)}
      >
        <div className="flex flex-column gap-3 pt-2">
          <div className="flex flex-column gap-2">
            <label htmlFor="catalogo-exportacion-codigo" className="premium-label">
              Código *
            </label>
            <div className="premium-input-group">
              <i className="pi pi-hashtag premium-input-icon" />
              {catalogo.codigoNumerico ? (
                <InputNumber
                  id="catalogo-exportacion-codigo"
                  value={registro.codigo === "" ? null : registro.codigo}
                  onValueChange={(evento) =>
                    setRegistro((actual) => ({ ...actual, codigo: evento.value }))
                  }
                  useGrouping={false}
                  min={0}
                  maxFractionDigits={0}
                  placeholder={catalogo.placeholderCodigo}
                  disabled={guardando}
                  className="w-full"
                />
              ) : (
                <InputText
                  id="catalogo-exportacion-codigo"
                  value={registro.codigo}
                  onChange={(evento) =>
                    setRegistro((actual) => ({ ...actual, codigo: evento.target.value }))
                  }
                  maxLength={catalogo.maxLength}
                  placeholder={catalogo.placeholderCodigo}
                  disabled={guardando}
                  autoFocus
                />
              )}
            </div>
            <small style={{ color: "var(--text-muted)" }}>
              {catalogo.codigoNumerico
                ? "Ingrese un número entero."
                : `Máximo ${catalogo.maxLength} caracteres.`}
            </small>
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="catalogo-exportacion-descripcion" className="premium-label">
              Descripción *
            </label>
            <div className="premium-input-group">
              <i className="pi pi-align-left premium-input-icon" />
              <InputTextarea
                id="catalogo-exportacion-descripcion"
                value={registro.descripcion}
                onChange={(evento) =>
                  setRegistro((actual) => ({
                    ...actual,
                    descripcion: evento.target.value,
                  }))
                }
                placeholder={catalogo.placeholderDescripcion}
                rows={3}
                autoResize
                disabled={guardando}
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={dialogoEliminarVisible}
        style={{ width: "440px", maxWidth: "94vw" }}
        header="Confirmar eliminación"
        modal
        footer={pieDialogoEliminar}
        onHide={() => setDialogoEliminarVisible(false)}
      >
        <div className="flex align-items-start gap-3 py-2">
          <i className="pi pi-exclamation-triangle text-red-500 text-3xl" />
          <span style={{ color: "var(--text-primary)" }}>
            ¿Está seguro de que desea eliminar el registro{" "}
            <b>{registro.descripcion || registro.codigo}</b>?
          </span>
        </div>
      </Dialog>
    </section>
  );
}
