/**
 * modal.js
 *
 * Script para la gestión y visualización de órdenes en el modal.
 * - Contiene datos de ejemplo de órdenes y funciones para formateo y limpieza de datos.
 * - Inicializa el cliente y obtiene órdenes desde la API de Freshdesk o VTEX.
 * - Remapea y muestra detalles de órdenes en la interfaz modal.
 *
 * Funciones principales:
 *   - init: Inicializa el modal y obtiene órdenes.
 *   - formatDateForDisplay: Formatea fechas para mostrar en español.
 *   - limpiarCorreoVtex: Limpia y normaliza correos electrónicos de VTEX.
 *   - getOrdersFDK, getOrderDetailFDK, remapVtexOrderToLocalStructure: (no mostradas aquí) para integración y transformación de datos.
 */

// --- DATOS DE EJEMPLO (AHORA CON ESTRUCTURA COMPLETA) ---
const ordenes = [
    {
        id: "ORD-2024-001",
        cliente: "Ana Martínez",
        fecha: "2024-05-10T10:30:00Z",
        total: 45500,
        estado: "Entregado",
        items: [
            { nombre: "Mouse Inalámbrico Avanzado", cantidad: 1, precio: 25000 },
            { nombre: "Alfombrilla para Mouse XL", cantidad: 1, precio: 12000 },
            { nombre: "Pack de Baterías AA", cantidad: 1, precio: 8500 }
        ],
        contactDetails: {
            email: "ana.martinez@email.com",
            telefono: "+56987654321",
            documento: "12.345.678-9"
        },
        shippingDetails: {
            ciudad: "Providencia",
            calle: "Av. Siempre Viva 742",
            codigoPostal: "7500000"
        }
    },
    {
        id: "ORD-2024-002",
        cliente: "Carlos Rodríguez",
        fecha: "2024-05-11T15:00:00Z",
        total: 129990,
        estado: "Enviado",
        items: [
            { nombre: "Teclado Mecánico RGB", cantidad: 1, precio: 89990 },
            { nombre: "Hub USB-C 7-en-1", cantidad: 1, precio: 40000 }
        ],
        contactDetails: {
            email: "carlos.r@email.com",
            telefono: "+56911223344",
            documento: "11.222.333-4"
        },
        shippingDetails: {
            ciudad: "Las Condes",
            calle: "Calle Falsa 123, Depto 4B",
            codigoPostal: "7560000"
        }
    },
    {
        id: "ORD-2024-003",
        cliente: "Sofía Gómez",
        fecha: "2024-05-12T09:00:00Z",
        total: 24900,
        estado: "Procesando",
        items: [
            { nombre: "Cable HDMI 2.1 (3 metros)", cantidad: 2, precio: 12450 }
        ],
        contactDetails: {
            email: "sofia.gomez@email.com",
            telefono: "+56955667788",
            documento: "20.111.222-3"
        },
        shippingDetails: {
            ciudad: "Santiago Centro",
            calle: "Paseo Ahumada 50",
            codigoPostal: "8320000"
        }
    }
];

init();



async function init() {


    console.log("Initializing modal App");
    client = await app.initialized();




    try {
        getOrdersFDK("262030067").then(ordenes => {
            ordenes.forEach(orden => {
                getOrderDetailFDK(orden.orderId).then(orderDetail => {
                    remapVtexOrderToLocalStructure(orderDetail)
                });
            })
        });
    }
    catch (error) {
        console.error("Error fetching contact details: ", error);
    }

}

function formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Opciones de formato para día, mes (abreviado), año
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    } catch (e) {
        console.error("Error al formatear fecha:", dateString, e);
        return 'N/A';
    }
}

const limpiarCorreoVtex = (correoCompleto) => {

    if (typeof correoCompleto !== 'string' || !correoCompleto.includes('@')) {

        return correoCompleto;
    }

    try {

        const [nombreUsuario, dominioCompleto] = correoCompleto.split('@');
        const dominioLimpio = dominioCompleto.split('-')[0];

        return `${nombreUsuario}@${dominioLimpio}`;

    } catch (error) {

        console.error("Ocurrió un error al procesar el correo:", error);
        return correoCompleto;
    }
};

async function cancelOrderFDK(client, orderId, reason) {
    try {
        const response = await client.request.invokeTemplate('cancelOrder', {
            context: { orderId: orderId, reason: reason }
        });

        // VTEX API de cancelación suele devolver un 200 OK o 204 No Content para éxito.
        if (response.status === 200 || response.status === 204) {
            return { success: true };
        } else {
            // Si VTEX API retorna un estado no 2xx pero no lanza un error directo del FDK
            let errorMessage = `Error HTTP ${response.status}: ${response.statusText || 'Error desconocido'}`;
            try {
                const errorData = JSON.parse(response.response);
                if (errorData && errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                } else if (errorData.message) { // Algunos errores tienen el mensaje directamente en 'message'
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                // Si la respuesta no es un JSON válido, usamos el mensaje HTTP
                console.warn("No se pudo parsear la respuesta de error de la API:", response.response);
            }
            return { success: false, message: `API: ${errorMessage}` };
        }
    } catch (error) {
        // Este catch maneja errores de red, errores de invocación de FDK, o JSON no parseable del FDK
        let errorMessage = 'Error desconocido al cancelar la orden.';
        try {
            // Intentamos parsear la respuesta de error del FDK si existe y es JSON
            if (error.response) {
                const errorResponse = JSON.parse(error.response);
                if (errorResponse && errorResponse.message) {
                    errorMessage = errorResponse.message;
                } else if (errorResponse.error && errorResponse.error.message) {
                    errorMessage = errorResponse.error.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
        } catch (parseError) {
            // Fallback si error.response no es un JSON válido
            if (error.message) errorMessage = error.message;
        }
        console.error(`Error al cancelar la orden ${orderId}:`, error);
        return { success: false, message: `Error  al cancelar la orden: ${errorMessage}` };
    }
}



/**
* Realiza una llamada a la API de VTEX para obtener una lista de órdenes.
*/
async function fetchVtexOrders(accountName, appKey, appToken) {
    const url = `https://${accountName}.vtexcommercestable.com.br/api/oms/pvt/orders`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': appKey,
        'X-VTEX-API-AppToken': appToken
    };
    try {
        const response = await fetch(url, { method: 'GET', headers: headers });
        if (!response.ok) {
            throw new Error(`Error en la API de VTEX: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.list || [];
    } catch (error) {
        console.error("Falló la obtención de órdenes de VTEX:", error);
        return [];
    }
}





async function getOrders(contact) {
    console.log("inicio get orders");
    try {
        const response = await client.request.invokeTemplate('getOrders', {
            context: {
                rut: contact
            }
        });
        console.log("Respuesta de getOrders:", response);
        const data = JSON.parse(response.response);

        console.log("Datos obtenidos:", data.list);
        return data.list;

    } catch (error) {
        console.log("Error al obtener órdenes:", error);
        return [];
    }
}


async function loadOrderData() {
    const container = document.getElementById('order-list-container');

    // --- OBTENER RUT DEL CONTEXTO ---
    // Ejemplo: const contactData = await client.data.get('contact');
    // const rut = contactData.contact.cf_rut; 
    const rutEjemplo = "262030067"; // Usar un valor real para pruebas

    try {
        const vtexOrderSummaries = await getOrdersFDK(rutEjemplo);


        if (vtexOrderSummaries.length === 0) {
            container.innerHTML = `<div class="loader">No se encontraron órdenes para el RUT ${rutEjemplo}.</div>`;
            return;
        }

        container.innerHTML = '';

        vtexOrderSummaries.forEach(summary => {

            console.log("Resumen de orden:", summary);

            const accordion = document.createElement('fw-accordion');
            accordion.classList.add('order-accordion');
            const accordionTitle = document.createElement('fw-accordion-title');
            const accordionBody = document.createElement('fw-accordion-body');
            accordionTitle.textContent = `Orden ${summary.orderId} - ${summary.clientName}`;

            let estadoPillHTML = '';
            // Usamos el 'status' del resumen para el acordeón
            if (summary.status === 'invoiced' || summary.status === 'delivered') {
                estadoPillHTML = `<div class="success-pill">Pagado/Entregado</div>`;
            } else if (summary.status === 'handling' || summary.status === 'ready-for-handling') {
                estadoPillHTML = `<div class="warning-pill">En Preparación</div>`;
            } else {
                estadoPillHTML = `<div class="info-pill success-pill">Enviado</div>`;
            }
            // Usamos 'totalValue' del resumen para el acordeón
            const totalFormateado = (summary.totalValue / 100).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

            accordionBody.innerHTML = `
                        <div class="card">
                            <div class="order-status">${estadoPillHTML}</div>
                            <div class="monto-total-preview">${totalFormateado}</div>
                            <div class="card-body">
                                <p><strong>Creada:</strong> ${formatDateForDisplay(summary.creationDate)}</p>
                                <p><strong>Envío Estimado:</strong> ${formatDateForDisplay(summary.ShippingEstimatedDateMax)}</p>
                                <p><strong>Origen:</strong> ${summary.origin}</p>
                                <p><strong>Estado:</strong> ${summary.statusDescription}</p>

                            <p>Haz clic para ver la información completa de la orden.</p></div>
                            <div class="buttons-bottom">
                                <button class="btn btn-primary view-vtx-details-btn" data-order-id="${summary.orderId}">Más detalle en VTX</button>
                                <button class="btn btn-secondary cancel-order-btn" data-order-id="${summary.orderId}">Cancelar Orden</button>
                            </div>
                            <div class="cancel-form-container" id="cancel-form-${summary.orderId}">
                                <p class="text-sm text-gray-700">Por favor, ingresa la razón de la cancelación:</p>
                                <textarea class="cancel-reason-input" data-order-id="${summary.orderId}" placeholder="Razón de cancelación (requerido)"></textarea>
                                <div class="cancel-form-buttons">
                                    <button class="btn btn-danger confirm-cancel-btn" data-order-id="${summary.orderId}">Confirmar Cancelación</button>
                                    <button class="btn btn-tertiary close-cancel-form-btn" data-order-id="${summary.orderId}">Cerrar</button>
                                </div>
                                <div class="message-box" id="cancel-message-${summary.orderId}"></div>
                            </div>
                        </div>
                    `;
            accordion.appendChild(accordionTitle);
            accordion.appendChild(accordionBody);
            container.appendChild(accordion);
        });

        document.querySelectorAll('.view-vtx-details-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                button.textContent = 'Cargando...';
                button.disabled = true;
                const orderId = event.currentTarget.getAttribute('data-order-id');
                abrirVentanaDetalle(orderId, button);
            });
        });

        // Event listeners para los botones "Cancelar Orden" (mostrar formulario)
        document.querySelectorAll('.cancel-order-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.currentTarget.getAttribute('data-order-id');
                const buttonsBottom = document.getElementById(`buttons-bottom-${orderId}`);
                const cancelForm = document.getElementById(`cancel-form-${orderId}`);

                if (buttonsBottom) buttonsBottom.style.display = 'none';
                if (cancelForm) cancelForm.style.display = 'flex';
            });
        });

        // Event listeners para los botones "Cerrar" (ocultar formulario)
        document.querySelectorAll('.close-cancel-form-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.currentTarget.getAttribute('data-order-id');
                const buttonsBottom = document.getElementById(`buttons-bottom-${orderId}`);
                const cancelForm = document.getElementById(`cancel-form-${orderId}`);
                const messageBox = document.getElementById(`cancel-message-${orderId}`);

                if (buttonsBottom) buttonsBottom.style.display = 'flex';
                if (cancelForm) {
                    cancelForm.style.display = 'none';
                    const textarea = cancelForm.querySelector('.cancel-reason-input');
                    if (textarea) textarea.value = ''; // Limpiar el campo
                }
                if (messageBox) {
                    messageBox.textContent = ''; // Limpiar mensaje
                    messageBox.className = 'message-box';
                }
            });
        });

        // Event listeners para los botones "Confirmar Cancelación"
        document.querySelectorAll('.confirm-cancel-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const orderId = event.currentTarget.getAttribute('data-order-id');
                const textarea = document.querySelector(`.cancel-reason-input[data-order-id="${orderId}"]`);
                const reason = textarea ? textarea.value.trim() : '';
                const messageBox = document.getElementById(`cancel-message-${orderId}`);

                if (!reason) {
                    messageBox.textContent = 'La razón de cancelación es obligatoria.';
                    messageBox.className = 'message-box error';
                    return;
                }

                button.textContent = 'Cancelando...';
                button.disabled = true;
                textarea.disabled = true;

                try {
                    const result = await cancelOrderFDK(client, orderId, reason); // 'result' es { success: boolean, message?: string }
                    if (result.success) {
                        messageBox.textContent = `Orden ${orderId} cancelada exitosamente.`;
                        messageBox.className = 'message-box success';
                        // Opcional: recargar la lista de órdenes o actualizar el estado en el UI
                        // await loadOrderData(); 
                    } else {
                        // CAMBIO: Usamos el mensaje devuelto por cancelOrderFDK
                        messageBox.textContent = result.message || `Error al cancelar la orden ${orderId}.`;
                        messageBox.className = 'message-box error';
                    }
                } catch (error) {
                    // Este catch solo se activaría si hay un error inesperado no manejado por cancelOrderFDK
                    messageBox.textContent = `Ocurrió un error inesperado: ${error.message}`;
                    messageBox.className = 'message-box error';
                    console.error(error);
                } finally {
                    button.textContent = 'Confirmar Cancelación';
                    button.disabled = false;
                    textarea.disabled = false;
                }
            });
        });
    } catch (error) {
        container.innerHTML = `<div class="loader">Ocurrió un error: ${error.message}</div>`;
    }
}


async function getOrdersFDK(rut) {
    try {
        // CAMBIO: Usando invokeTemplate en lugar de invoke
        const response = await client.request.invokeTemplate('getOrders', { context: { rut: rut } });
        const data = JSON.parse(response.response);
        console.log("Respuesta de getOrdersFDK:", data.list);
        return data.list || [];
    } catch (error) {
        console.error("Error al invocar 'getOrders':", error);
        return [];
    }
}

async function getOrderDetailFDK(orderId) {
    try {
        // CAMBIO: Usando invokeTemplate en lugar de invoke
        const response = await client.request.invokeTemplate('getOrderDetails', { context: { orderId: orderId } });
        console.log("Respuesta de getOrderDetailFDK:", response);
        return JSON.parse(response.response);
    } catch (error) {
        console.error(`Error al invocar 'getOrderDetails' para la orden ${orderId}:`, error);
        return null;
    }
}

function remapVtexOrderToLocalStructure(vtexOrder) {
    const clientProfile = vtexOrder.clientProfileData || {};
    const shippingAddress = vtexOrder.shippingData ? (vtexOrder.shippingData.address || {}) : {};

    const localOrder = {
        id: vtexOrder.orderId,
        cliente: `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim(),
        fecha: vtexOrder.creationDate,
        total: vtexOrder.value / 100,
        // Inicialmente se guarda el estado descriptivo. Será sobreescrito abajo.
        estado: vtexOrder.statusDescription || vtexOrder.status,
        items: (vtexOrder.items || []).map(item => ({
            nombre: item.name,
            cantidad: item.quantity,
            precio: item.price / 100
        })),
        contactDetails: {
            email: limpiarCorreoVtex(clientProfile.email),
            telefono: clientProfile.phone,
            documento: clientProfile.document
        },
        shippingDetails: {
            ciudad: shippingAddress.city || shippingAddress.neighborhood || 'No disponible',
            calle: `${shippingAddress.street || ''}, ${shippingAddress.number || ''}`.trim(),
            codigoPostal: shippingAddress.postalCode
        }
    };

    // CORRECCIÓN: Sobreescribimos la propiedad 'estado' con el valor simplificado
    // que la ventana de detalle necesita para mostrar la "pill" de estado.
    if (vtexOrder.status === 'invoiced' || vtexOrder.status === 'delivered') {
        localOrder.estado = 'Entregado';
    } else if (vtexOrder.status === 'handling' || vtexOrder.status === 'ready-for-handling') {
        localOrder.estado = 'Procesando';
    } else {
        localOrder.estado = 'Enviado';
    }

    return localOrder;
}


document.addEventListener('DOMContentLoaded', async () => {
    client = await app.initialized();
    loadOrderData();


    // const container = document.getElementById('order-list-container');
    // if (!container) return;

    // ordenes.forEach(orden => {
    //     const accordion = document.createElement('fw-accordion');
    //     const accordionTitle = document.createElement('fw-accordion-title');
    //     const accordionBody = document.createElement('fw-accordion-body');

    //     accordionTitle.textContent = `Orden Número ${orden.id}`;

    //     let estadoPillHTML = '';
    //     if (orden.estado === 'Entregado') {
    //         estadoPillHTML = `<div class="success-pill">Pagado</div>`;
    //     } else if (orden.estado === 'Procesando') {
    //         estadoPillHTML = `<div class="warning-pill">En Preparación</div>`;
    //     } else if (orden.estado === 'Enviado') {
    //         estadoPillHTML = `<div class="info-pill">Enviado</div>`;
    //     }

    //     const itemsHTML = orden.items.map(item =>
    //         `<div class="card-item cart-item">${item.nombre}</div>`
    //     ).join('');

    //     const totalFormateado = orden.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    //     const cardContentHTML = `
    //                 <div class="card">
    //                     <div class="order-status">${estadoPillHTML}</div>
    //                     <div class="monto-total-preview">${totalFormateado}</div>
    //                     <div>
    //                         <div class="card-title">Detalle Items</div>
    //                         <div class="card-body">${itemsHTML}</div>
    //                     </div>
    //                     <div class="buttons-bottom">
    //                         <button class="btn btn-primary view-vtx-details-btn" data-order-id="${orden.id}">Más detalle en VTX</button>
    //                         <button class="btn btn-secondary">Cancelar Orden</button>
    //                     </div>
    //                 </div>
    //             `;

    //     accordionBody.innerHTML = cardContentHTML;

    //     accordion.appendChild(accordionTitle);
    //     accordion.appendChild(accordionBody);
    //     container.appendChild(accordion);
    // });

    document.querySelectorAll('.view-vtx-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const orderId = event.currentTarget.getAttribute('data-order-id');
            abrirVentanaDetalle(orderId);
        });
    });






});

// function abrirVentanaDetalle(id) {
//     const ordenSeleccionada = ordenes.find(o => o.id === id);
//     if (!ordenSeleccionada) {
//         console.error("No se encontró la orden.");
//         return;
//     }

//     const windowFeatures = "width=800,height=850,scrollbars=yes,resizable=yes";
//     const detalleVentana = window.open('detalle_orden.html', 'detalleOrdenVentana', windowFeatures);

//     detalleVentana.onload = () => {
//         detalleVentana.postMessage(ordenSeleccionada, '*');
//     };
// }


async function abrirVentanaDetalle(id, buttonElement) {
    try {
        const vtexOrderDetail = await getOrderDetailFDK(id);
        if (!vtexOrderDetail) {
            console.log('No se pudo obtener el detalle de esta orden.');
            return;
        }

        const ordenCompleta = remapVtexOrderToLocalStructure(vtexOrderDetail);

        const windowFeatures = "width=800,height=850,scrollbars=yes,resizable=yes";
        const detalleVentana = window.open('detalle_orden.html', 'detalleOrdenVentana', windowFeatures);
        detalleVentana.onload = () => {
            detalleVentana.postMessage(ordenCompleta, '*');
        };
    } catch (error) {
        console.error("Error al abrir ventana de detalle:", error);
        console.log("Ocurrió un error al procesar el detalle de la orden.");
    } finally {
        if (buttonElement) {
            buttonElement.textContent = 'Más detalle en VTX';
            buttonElement.disabled = false;
        }
    }
}