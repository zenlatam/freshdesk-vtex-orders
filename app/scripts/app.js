/**
 * app.js
 * 
 * Script principal para la integración de la app en Freshdesk.
 * - Inicializa el cliente de la app.
 * - Escucha el evento de activación para mostrar un modal con detalles de órdenes.
 * - Obtiene detalles del contacto y permite invocar plantillas para obtener órdenes.
 *
 * Funciones principales:
 *   - init: Inicializa la app y configura eventos.
 *   - getOrders: Solicita órdenes asociadas a un contacto.
 *   - openModal: Despliega un modal con información contextual.
 *   - getContactDetails: Obtiene detalles del contacto actual.
 */

let client;
let contactRut;

init();




async function init() {


  console.log("Initializing Custom App");
  client = await app.initialized();



  console.log("Abriendo Modal...");
  client.events.on('app.activated', openModal);

  try {
    const contactDetails = await getContactDetails();
    console.log("Contact Details: ", contactDetails);
  }
  catch (error) {
    console.error("Error fetching contact details: ", error);
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

    } catch (error) {
        console.log("Error al obtener órdenes:", error);
    }
}


function openModal() {
  console.log("Modal opened");



  let titulo = `Detalle de ordenes`;

  try {
    client.interface.trigger('showModal', {
      title: titulo,
      data: {
        title: "Ejemplo de Titulo enviado por contexto",
        content: "Ejemplo de detalle enviado por contexto",
        rut: contactRut
      },
      template: './views/modal.html'
    }).then(
      function (data) {
        console.log("DATAA: ", data);
      },
      function (error) {
        console.log(error);
      }
    );

  } catch (error) {
    console.log("Error opening modal");
    console.error(error);
  }
}


async function getContactDetails() {
  try {
    const data = await client.data.get("contact");
    // success output
    // data is {ticket: {"subject": "support needed for..",..}}
    return data;
  } catch (error) {
    // failure operation
    console.log(error);
  }
}


