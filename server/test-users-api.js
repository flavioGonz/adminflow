// Script de prueba para verificar que los endpoints de usuarios funcionan con IDs numéricos

const API_URL = 'http://localhost:5000';

async function testUserEndpoints() {
    console.log('🧪 Iniciando pruebas de endpoints de usuarios...\n');

    // Test 1: Obtener usuarios
    console.log('📋 Test 1: GET /api/users/registered');
    try {
        const response = await fetch(`${API_URL}/api/users/registered`);
        const users = await response.json();
        console.log('✅ Usuarios obtenidos:', users.length);
        console.log('Usuarios:', users.map(u => ({ id: u.id, _id: u._id, email: u.email })));

        // Test 2: Actualizar usuario con ID numérico (usuario antiguo)
        const oldUser = users.find(u => u.email === 'tblezio@infratec.com.uy');
        if (oldUser) {
            console.log('\n📝 Test 2: PATCH /api/users/registered/:id (ID numérico)');
            console.log('Usuario a actualizar:', { id: oldUser.id, _id: oldUser._id, email: oldUser.email });

            const updateResponse = await fetch(`${API_URL}/api/users/registered/${oldUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roles: ['support'],
                    metadata: { test: 'actualización de prueba' }
                })
            });

            if (updateResponse.ok) {
                const updated = await updateResponse.json();
                console.log('✅ Usuario actualizado correctamente');
                console.log('Resultado:', updated);
            } else {
                const error = await updateResponse.json();
                console.log('❌ Error al actualizar:', error);
            }
        }

        // Test 3: Actualizar usuario con ObjectId (usuario nuevo)
        const newUser = users.find(u => u.email === 'flavio@infratec.com.uy');
        if (newUser) {
            console.log('\n📝 Test 3: PATCH /api/users/registered/:id (ObjectId)');
            console.log('Usuario a actualizar:', { id: newUser.id, _id: newUser._id, email: newUser.email });

            const updateResponse = await fetch(`${API_URL}/api/users/registered/${newUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roles: ['admin'],
                    metadata: { test: 'actualización de prueba' }
                })
            });

            if (updateResponse.ok) {
                const updated = await updateResponse.json();
                console.log('✅ Usuario actualizado correctamente');
                console.log('Resultado:', updated);
            } else {
                const error = await updateResponse.json();
                console.log('❌ Error al actualizar:', error);
            }
        }

    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }

    console.log('\n✅ Pruebas completadas');
}

testUserEndpoints();
