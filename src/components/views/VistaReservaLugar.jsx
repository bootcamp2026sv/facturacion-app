import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';

export default function VistaReservaLugar({ modelo, accion, descripcion, endpoints = [], tipoMock = 'formulario' }) {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  // Generate realistic mock data based on the model
  const getMockData = () => {
    switch (modelo) {
      case 'Ventas (DTE)':
        return [
          { id: 1, codigoGeneracion: '288e60c6-aeb4-414b-9227-9b4c16d35c1e', fecha: '2026-06-07T14:30:00', cliente: 'Juan Pérez López', total: '$678.00', tipo: '01 - Factura' },
          { id: 2, codigoGeneracion: '7a8b60d2-cf14-49c7-8142-2b4c16d35f4a', fecha: '2026-06-07T11:15:00', cliente: 'Distribuidora Cuscatlán S.A.', total: '$1,250.00', tipo: '03 - Crédito Fiscal' },
          { id: 3, codigoGeneracion: 'f32da112-9ab2-4b2a-8812-7b8c26d45e11', fecha: '2026-06-06T16:45:00', cliente: 'María Elena Gómez', total: '$45.99', tipo: '01 - Factura' },
          { id: 4, codigoGeneracion: 'c42e1245-1bb4-4c8d-9923-0b4e23a45c1d', fecha: '2026-06-05T09:20:00', cliente: 'José Mauricio Rivas', total: '$18.50', tipo: '01 - Factura' }
        ];
      case 'Productos':
        return [
          { id: 1, codigo: 'PROD-001', nombre: 'Laptop HP 15.6"', costo: '$500.00', precioConIVA: '$678.00', existencia: '45.00', marca: 'HP' },
          { id: 2, codigo: 'PROD-002', nombre: 'Mouse Inalámbrico Logitech', costo: '$15.00', precioConIVA: '$20.34', existencia: '150.00', marca: 'Logitech' },
          { id: 3, codigo: 'PROD-003', nombre: 'Monitor Dell 24" IPS', costo: '$120.00', precioConIVA: '$162.72', existencia: '25.00', marca: 'Dell' }
        ];
      case 'Clientes':
        return [
          { id: 1, nombre: 'Juan Pérez López', documento: '01234567-8', nrc: '123456-7', telefono: '2255-0000', correo: 'juan.perez@correo.com' },
          { id: 2, nombre: 'Distribuidora Cuscatlán S.A. de C.V.', documento: '0614-121285-101-5', nrc: '987654-3', telefono: '2500-1111', correo: 'contacto@cuscatlandist.com' },
          { id: 3, nombre: 'María Elena Gómez', documento: '02345678-9', nrc: 'N/A', telefono: '7888-2222', correo: 'maria.gomez@correo.com' }
        ];
      case 'Departamentos':
        return [
          { id: 1, codigo: '01', nombre: 'San Salvador' },
          { id: 2, codigo: '02', nombre: 'La Libertad' },
          { id: 3, codigo: '03', nombre: 'Santa Ana' },
          { id: 4, codigo: '04', nombre: 'San Miguel' }
        ];
      case 'Municipios':
        return [
          { id: 1, codigo: '01', nombre: 'San Salvador Centro', departamento: 'San Salvador' },
          { id: 2, codigo: '02', nombre: 'La Libertad Este', departamento: 'La Libertad' },
          { id: 3, codigo: '03', nombre: 'Santa Ana Centro', departamento: 'Santa Ana' }
        ];
      case 'Distritos':
        return [
          { id: 1, codigo: '01', nombre: 'San Salvador', municipio: 'San Salvador Centro' },
          { id: 2, codigo: '02', nombre: 'Antiguo Cuscatlán', municipio: 'La Libertad Este' },
          { id: 3, codigo: '03', nombre: 'Santa Ana', municipio: 'Santa Ana Centro' }
        ];
      case 'Correlativos DTE':
        return [
          { tipoDte: '01 - Factura de Consumidor Final', ambiente: '00 - Pruebas', ultimoCorrelativo: '000000000001000', numeroControl: 'DTE-01-M001P001-000000000001000' },
          { tipoDte: '03 - Comprobante de Crédito Fiscal', ambiente: '00 - Pruebas', ultimoCorrelativo: '000000000000254', numeroControl: 'DTE-03-M001P001-000000000000254' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-column gap-4">
      
      {/* Title Card */}
      <Card>
        <div className="flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="flex-1">
            <div className="flex align-items-center gap-2 mb-2">
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 border-round-3xl text-xs font-semibold uppercase">
                {modelo}
              </span>
            </div>
            <h2 className="m-0 mb-2 text-2xl font-bold text-900">
              {accion}
            </h2>
            <p className="m-0 text-sm text-600 line-height-3">
              {descripcion}
            </p>
          </div>
          
          {/* API Info */}
          <div className="p-3 bg-blue-50 text-blue-700 border-round flex align-items-start gap-2 text-sm border-left-3 border-blue-500 w-full md:w-20rem">
            <div className="w-full">
              <h4 className="m-0 mb-2 text-xs text-500 uppercase font-semibold">
                Endpoint Backend Vinculado
              </h4>
              <div className="flex flex-column gap-2">
                {endpoints.map((ep, idx) => (
                  <div key={idx} className="flex align-items-center gap-2 text-xs font-monospace">
                    <span className={`px-2 py-1 border-round text-white font-bold text-xs ${
                      ep.method === 'GET' ? 'bg-green-500' : 
                      ep.method === 'POST' ? 'bg-blue-500' : 
                      ep.method === 'PUT' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-600">{ep.path}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main View Panel */}
      <Card>
        
        {tipoMock === 'formulario' ? (
          /* Interactive Form Mockup */
          <form onSubmit={handleSubmit} className="p-fluid flex flex-column gap-4 w-full md:w-8">
            
            {success && (
              <div className="p-3 bg-green-50 border-1 border-green-200 text-green-700 border-round flex align-items-center gap-2 text-sm">
                <i className="pi pi-check-circle text-lg"></i>
                <span><strong>Simulación:</strong> Formulario de {modelo} guardado localmente en modo Demo.</span>
              </div>
            )}

            <div className="flex flex-column md:flex-row gap-3">
              <div className="flex-1 flex flex-column gap-2">
                <label className="font-bold text-xs text-800">Nombre / Razón Social</label>
                <InputText placeholder="Ingrese el nombre principal..." required />
              </div>
              <div className="flex-1 flex flex-column gap-2">
                <label className="font-bold text-xs text-800">Código / Identificador</label>
                <InputText placeholder="Código de registro..." />
              </div>
            </div>

            <div className="flex flex-column md:flex-row gap-3">
              <div className="flex-1 flex flex-column gap-2">
                <label className="font-bold text-xs text-800">Correo Electrónico</label>
                <InputText type="email" placeholder="correo@ejemplo.com" />
              </div>
              <div className="flex-1 flex flex-column gap-2">
                <label className="font-bold text-xs text-800">Teléfono de Contacto</label>
                <InputText placeholder="2200-0000" />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-bold text-xs text-800">Dirección / Ubicación Complementaria</label>
              <InputText placeholder="Calle, pasaje o número de establecimiento..." />
            </div>

            <div className="flex gap-3 mt-2">
              <Button type="submit" label="Guardar Registro" icon="pi pi-save" className="p-button-primary" />
              <Button type="button" label="Limpiar" icon="pi pi-refresh" className="p-button-outlined p-button-secondary" />
            </div>
          </form>
        ) : (
          /* Real PrimeReact DataTable with Interactive mock rows */
          <div>
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
              <IconField iconPosition="left" className="w-full md:w-20rem">
                <InputIcon className="pi pi-search" />
                <InputText placeholder="Buscar registros..." className="w-full" />
              </IconField>
              <Button label="Agregar Nuevo" icon="pi pi-plus" className="p-button-primary" />
            </div>
            
            <DataTable 
              value={getMockData()} 
              responsiveLayout="scroll" 
              className="p-datatable-striped text-sm"
            >
              {modelo === 'Ventas (DTE)' && [
                <Column key="id" field="id" header="ID" className="w-4rem"></Column>,
                <Column key="tipo" field="tipo" header="Tipo DTE"></Column>,
                <Column key="codigoGeneracion" field="codigoGeneracion" header="Código Generación (UUID)"></Column>,
                <Column key="fecha" field="fecha" header="Fecha/Hora"></Column>,
                <Column key="cliente" field="cliente" header="Cliente"></Column>,
                <Column key="total" field="total" header="Total"></Column>
              ]}
              {modelo === 'Productos' && [
                <Column key="codigo" field="codigo" header="Código"></Column>,
                <Column key="nombre" field="nombre" header="Nombre Producto"></Column>,
                <Column key="marca" field="marca" header="Marca"></Column>,
                <Column key="costo" field="costo" header="Costo"></Column>,
                <Column key="precioConIVA" field="precioConIVA" header="Precio (c/IVA)"></Column>,
                <Column key="existencia" field="existencia" header="Existencia"></Column>
              ]}
              {modelo === 'Clientes' && [
                <Column key="nombre" field="nombre" header="Nombre / Razón Social"></Column>,
                <Column key="documento" field="documento" header="DUI/NIT"></Column>,
                <Column key="nrc" field="nrc" header="NRC"></Column>,
                <Column key="telefono" field="telefono" header="Teléfono"></Column>,
                <Column key="correo" field="correo" header="Correo Electrónico"></Column>
              ]}
              {modelo === 'Departamentos' && [
                <Column key="id" field="id" header="ID"></Column>,
                <Column key="codigo" field="codigo" header="Código SV"></Column>,
                <Column key="nombre" field="nombre" header="Nombre Departamento"></Column>
              ]}
              {modelo === 'Municipios' && [
                <Column key="codigo" field="codigo" header="Código SV"></Column>,
                <Column key="nombre" field="nombre" header="Municipio"></Column>,
                <Column key="departamento" field="departamento" header="Departamento"></Column>
              ]}
              {modelo === 'Distritos' && [
                <Column key="codigo" field="codigo" header="Código SV"></Column>,
                <Column key="nombre" field="nombre" header="Distrito"></Column>,
                <Column key="municipio" field="municipio" header="Municipio"></Column>
              ]}
              {modelo === 'Correlativos DTE' && [
                <Column key="tipoDte" field="tipoDte" header="Tipo DTE"></Column>,
                <Column key="ambiente" field="ambiente" header="Ambiente"></Column>,
                <Column key="ultimoCorrelativo" field="ultimoCorrelativo" header="Último Correlativo"></Column>,
                <Column key="numeroControl" field="numeroControl" header="Estructura Control DTE"></Column>
              ]}
            </DataTable>
          </div>
        )}
      </Card>
    </div>
  );
}
