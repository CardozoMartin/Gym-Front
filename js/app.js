

let clientesData = [];
let filtroActual = 'todos';
let terminoBusqueda = '';

document.addEventListener('DOMContentLoaded', function() {
    const tableWrapper = document.getElementById('tableWrapper');
    
    function updateScrollIndicators() {
        const maxScroll = tableWrapper.scrollWidth - tableWrapper.clientWidth;
        
        if (tableWrapper.scrollLeft > 0) {
            tableWrapper.classList.add('scroll-start');
        } else {
            tableWrapper.classList.remove('scroll-start');
        }
        
        if (tableWrapper.scrollLeft < maxScroll) {
            tableWrapper.classList.add('scroll-end');
        } else {
            tableWrapper.classList.remove('scroll-end');
        }
    }

    tableWrapper.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
    updateScrollIndicators();
});
// URL base de la API

const API_URL = "https://gym-back-3.onrender.com" || 'http://localhost:5000';

// Funciones para el modal
function showModal() {
    document.getElementById('modal').style.display = 'block';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('clienteForm').reset();
}

// Calcular días restantes
function calcularDiasRestantes(fechaVencimiento) {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

// Obtener estado de membresía
function obtenerEstadoMembresia(fechaVencimiento) {
    const diasRestantes = calcularDiasRestantes(fechaVencimiento);

    if (diasRestantes < 0) {
        return {
            clase: 'status-inactive',
            texto: 'Inactivo',
            rowClass: 'row-inactive',
            mensaje: 'Membresía vencida'
        };
    } else if (diasRestantes <= 5) {
        return {
            clase: 'status-danger',
            texto: 'Por vencer',
            rowClass: 'row-danger',
            mensaje: `${diasRestantes} días restantes`
        };
    } else if (diasRestantes <= 10) {
        return {
            clase: 'status-warning',
            texto: 'Próximo a vencer',
            rowClass: 'row-warning',
            mensaje: `${diasRestantes} días restantes`
        };
    } else {
        return {
            clase: 'status-active',
            texto: 'Activo',
            rowClass: '',
            mensaje: `${diasRestantes} días restantes`
        };
    }
}

// Mostrar clientes en la tabla
function mostrarClientes(clientes) {
    const tbody = document.getElementById('clientesBody');
    tbody.innerHTML = '';

    clientes.forEach(cliente => {
        const estado = obtenerEstadoMembresia(cliente.fechaVencimiento);
        const tr = document.createElement('tr');
        tr.className = estado.rowClass;

        tr.innerHTML = `
            <td>${cliente.nombre} ${cliente.apellido}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefono}</td>
            <td>${new Date(cliente.fechaInicio).toLocaleDateString()}</td>
            <td>${new Date(cliente.fechaVencimiento).toLocaleDateString()}</td>
            <td>
                <div class="status ${estado.clase}">
                    ${estado.texto}
                    <span class="time-remaining">${estado.mensaje}</span>
                </div>
            </td>
            <td class="actions-cell">
                <button onclick="renovarMembresia('${cliente._id}')" class="btn-primary">Renovar</button>
                <button onclick="eliminarCliente('${cliente._id}')" class="btn-danger">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Cargar clientes
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes/`);
        clientesData = await response.json(); // Se guarda en clientesData
        actualizarEstadisticas();
        filtrarClientes(); // Aquí no pasas los clientes directamente
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar los clientes');
    }
}

// Crear nuevo cliente
document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value
    };

    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clienteData)
        });

        if (response.ok) {
            hideModal();
            cargarClientes();
        } else {
            alert('Error al crear el cliente');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el cliente');
    }
});

// Renovar membresía
async function renovarMembresia(id) {
    const result = await Swal.fire({
        title: '¿Renovar Membresía?',
        text: "¿Estás seguro de que deseas renovar la membresía de este cliente?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, renovar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
        return; // El usuario canceló la acción
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${id}/renovar`, {
            method: 'POST'
        });

        if (response.ok) {
            await Swal.fire({
                title: 'Membresía Renovada',
                text: 'La membresía del cliente se ha renovado exitosamente.',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
            cargarClientes(); // Recargar la lista de clientes
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo renovar la membresía.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al renovar la membresía.',
            icon: 'error',
            confirmButtonColor: '#d33'
        });
    }
}


// Eliminar cliente
async function eliminarCliente(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
        return; // El usuario canceló la acción
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await Swal.fire({
                title: 'Eliminado',
                text: 'El cliente ha sido eliminado exitosamente.',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
            cargarClientes(); // Recargar la lista de clientes
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el cliente.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al eliminar el cliente.',
            icon: 'error',
            confirmButtonColor: '#d33'
        });
    }
}


function actualizarEstadisticas() {
    const activos = clientesData.filter(cliente => 
        calcularDiasRestantes(cliente.fechaVencimiento) >= 0
    ).length;
    
    document.getElementById('totalClientes').textContent = clientesData.length;
    document.getElementById('clientesActivos').textContent = activos;
    document.getElementById('clientesInactivos').textContent = clientesData.length - activos;
}

// Función para cambiar el filtro activo
function cambiarFiltro(filtro) {
    filtroActual = filtro;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filtro}"]`).classList.add('active');
    filtrarClientes();
}

// Función para filtrar clientes
function filtrarClientes() {
    terminoBusqueda = document.getElementById('searchInput').value.toLowerCase();
    
    let clientesFiltrados = clientesData.filter(cliente => {
        const diasRestantes = calcularDiasRestantes(cliente.fechaVencimiento);
        
        // Lógica de filtrado actualizada
        const cumpleFiltro = 
            filtroActual === 'todos' ? true :
            filtroActual === 'activos' ? diasRestantes >= 0 :
            filtroActual === 'proximosVencer' ? (diasRestantes <= 5 && diasRestantes >= 0) :
            diasRestantes < 0; // caso inactivos

        const cumpleBusqueda = terminoBusqueda === '' ? true :
            `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(terminoBusqueda) ||
            cliente.email.toLowerCase().includes(terminoBusqueda) ||
            cliente.telefono.includes(terminoBusqueda);

        return cumpleFiltro && cumpleBusqueda;
    });

    mostrarClientes(clientesFiltrados);
    
    // Mostrar mensaje si no hay resultados
    const noResultsDiv = document.getElementById('noResults');
    const tableDiv = document.getElementById('clientesTable');
    
    if (clientesFiltrados.length === 0) {
        noResultsDiv.style.display = 'block';
        tableDiv.style.display = 'none';
    } else {
        noResultsDiv.style.display = 'none';
        tableDiv.style.display = 'table';
    }
}

document.getElementById('btnProximosVencer').addEventListener('click', function() {
    filtroActual = 'proximosVencer';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    this.classList.add('active');
    filtrarClientes();
});
// Función para verificar clientes próximos a vencer



// Modificar la función cargarClientes
async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        clientesData = await response.json();
        actualizarEstadisticas();
        filtrarClientes();
        
        // Agregar la verificación de clientes próximos a vencer
       
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al cargar los clientes',
            icon: 'error',
            confirmButtonColor: '#d33'
        });
    }
}




// Cargar clientes al iniciar y actualizar cada minuto
cargarClientes();

