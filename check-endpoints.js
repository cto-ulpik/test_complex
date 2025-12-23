const http = require('http');

const endpoints = [
  '/api/materias',
  '/api/estadisticas',
  '/api/preguntas-con-respuesta/total'
];

console.log('🔍 Verificando endpoints en http://localhost:5001...\n');

endpoints.forEach(endpoint => {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: endpoint,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ ${endpoint} - OK (${res.statusCode})`);
        if (data.length < 200) console.log(`   Respuesta: ${data.substring(0, 100)}...`);
      } else {
        console.log(`❌ ${endpoint} - ERROR (${res.statusCode})`);
        if (data.includes('Cannot GET')) {
          console.log(`   ⚠️  Endpoint NO existe en el servidor actual`);
        }
      }
    });
  });

  req.on('error', (e) => {
    console.log(`❌ ${endpoint} - ERROR: ${e.message}`);
  });

  req.end();
  
  // Pequeña pausa entre requests
  setTimeout(() => {}, 100);
});

setTimeout(() => {
  console.log('\n💡 Si ves errores, el servidor necesita reiniciarse.');
  process.exit(0);
}, 2000);
