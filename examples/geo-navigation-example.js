/**
 * Geographic Navigation Example
 *
 * This example demonstrates location-based navigation features
 * including distance calculation, route planning, and POI discovery.
 */

const venom = require('../dist');

venom
  .create({
    session: 'geo-navigation-example',
    multidevice: true,
  })
  .then(async (client) => {
    console.log('Geo-Navigation Bot started!');
    await start(client);
  })
  .catch((err) => {
    console.error('Error:', err);
  });

async function start(client) {
  // Sample Points of Interest (POIs)
  const pointsOfInterest = [
    {
      id: 'poi-1',
      name: 'Restaurante Italiano',
      description: 'Melhor massa da cidade',
      coordinates: { latitude: -23.550520, longitude: -46.633308 },
      category: 'Restaurante',
    },
    {
      id: 'poi-2',
      name: 'Parque Municipal',
      description: 'Ótimo para caminhadas',
      coordinates: { latitude: -23.552520, longitude: -46.635308 },
      category: 'Lazer',
    },
    {
      id: 'poi-3',
      name: 'Shopping Center',
      description: 'Compras e entretenimento',
      coordinates: { latitude: -23.548520, longitude: -46.631308 },
      category: 'Compras',
    },
    {
      id: 'poi-4',
      name: 'Hospital Central',
      description: 'Atendimento 24h',
      coordinates: { latitude: -23.554520, longitude: -46.637308 },
      category: 'Saúde',
    },
  ];

  client.onMessage(async (message) => {
    if (message.isGroupMsg || message.from === 'status@broadcast') return;

    const chatId = message.from;
    const text = message.body.toLowerCase();

    try {
      // ============= LOCATION COMMANDS =============

      // Command: /localizacao - Send a location
      if (text.startsWith('/localizacao') || text.startsWith('/location')) {
        const location = {
          latitude: -23.550520,
          longitude: -46.633308,
        };

        await client.sendLocationWithNavigation(
          chatId,
          location,
          'Minha Empresa',
          'Av. Paulista, 1000 - São Paulo, SP'
        );
        return;
      }

      // Command: /distancia <lat1,lon1> <lat2,lon2> - Calculate distance
      if (text.startsWith('/distancia') || text.startsWith('/distance')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
          const coords1 = parts[1].split(',');
          const coords2 = parts[2].split(',');

          const point1 = {
            latitude: parseFloat(coords1[0]),
            longitude: parseFloat(coords1[1]),
          };

          const point2 = {
            latitude: parseFloat(coords2[0]),
            longitude: parseFloat(coords2[1]),
          };

          await client.sendDistanceInfo(
            chatId,
            point1,
            point2,
            'Ponto A',
            'Ponto B'
          );
        } else {
          await client.sendText(
            chatId,
            'Uso: /distancia <lat1,lon1> <lat2,lon2>\nExemplo: /distancia -23.550520,-46.633308 -23.561414,-46.656178'
          );
        }
        return;
      }

      // Command: /rota <lat1,lon1> <lat2,lon2> - Create route
      if (text.startsWith('/rota') || text.startsWith('/route')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
          const coords1 = parts[1].split(',');
          const coords2 = parts[2].split(',');

          const origin = {
            latitude: parseFloat(coords1[0]),
            longitude: parseFloat(coords1[1]),
          };

          const destination = {
            latitude: parseFloat(coords2[0]),
            longitude: parseFloat(coords2[1]),
          };

          await client.createAndSendRoute(chatId, origin, destination);
        } else {
          await client.sendText(
            chatId,
            'Uso: /rota <lat_origem,lon_origem> <lat_destino,lon_destino>\nExemplo: /rota -23.550520,-46.633308 -23.561414,-46.656178'
          );
        }
        return;
      }

      // Command: /perto <lat,lon> [raio] - Find nearby POIs
      if (text.startsWith('/perto') || text.startsWith('/nearby')) {
        const parts = message.body.split(' ');
        if (parts.length >= 2) {
          const coords = parts[1].split(',');
          const location = {
            latitude: parseFloat(coords[0]),
            longitude: parseFloat(coords[1]),
          };

          const radius = parts[2] ? parseInt(parts[2]) : 1000; // Default 1km

          await client.sendNearbyPOIs(chatId, location, pointsOfInterest, radius);
        } else {
          await client.sendText(
            chatId,
            'Uso: /perto <lat,lon> [raio_metros]\nExemplo: /perto -23.550520,-46.633308 500'
          );
        }
        return;
      }

      // Command: /poi - List all points of interest
      if (text === '/poi' || text === '/pontos') {
        let response = '📍 *Pontos de Interesse Cadastrados*\n\n';

        pointsOfInterest.forEach((poi, index) => {
          response += `${index + 1}. *${poi.name}*\n`;
          response += `   ${poi.description}\n`;
          response += `   Categoria: ${poi.category}\n`;
          response += `   Coordenadas: ${poi.coordinates.latitude}, ${poi.coordinates.longitude}\n\n`;
        });

        response += '\n💡 Use /info <número> para mais detalhes';
        await client.sendText(chatId, response);
        return;
      }

      // Command: /info <number> - Get POI details
      if (text.startsWith('/info')) {
        const parts = message.body.split(' ');
        if (parts.length >= 2) {
          const index = parseInt(parts[1]) - 1;
          if (index >= 0 && index < pointsOfInterest.length) {
            const poi = pointsOfInterest[index];
            await client.sendLocationWithNavigation(
              chatId,
              poi.coordinates,
              poi.name,
              poi.description
            );
          } else {
            await client.sendText(chatId, 'POI não encontrado. Use /poi para ver a lista.');
          }
        }
        return;
      }

      // Command: /ajuda - Show help
      if (text === '/ajuda' || text === '/help' || text === '/comandos') {
        const helpText = `
🗺️ *Comandos de Navegação Geográfica*

*Localização:*
/localizacao - Enviar uma localização de exemplo
/poi - Listar pontos de interesse
/info <número> - Ver detalhes de um POI

*Navegação:*
/distancia <lat1,lon1> <lat2,lon2> - Calcular distância
/rota <origem> <destino> - Criar rota
/perto <lat,lon> [raio] - Encontrar POIs próximos

*Exemplos:*
/distancia -23.5505,-46.6333 -23.5614,-46.6561
/rota -23.5505,-46.6333 -23.5614,-46.6561
/perto -23.5505,-46.6333 500
/info 1

*Dica:* Você também pode enviar sua localização pelo WhatsApp!
        `;
        await client.sendText(chatId, helpText.trim());
        return;
      }

      // Handle shared location from WhatsApp
      if (message.type === 'location' && message.lat && message.lng) {
        const userLocation = {
          latitude: parseFloat(message.lat),
          longitude: parseFloat(message.lng),
        };

        // Find nearest POI
        const GeoNavigationHelper = require('../dist/api/helpers/geo-navigation').GeoNavigationHelper;
        const nearest = GeoNavigationHelper.findNearestPOI(userLocation, pointsOfInterest);

        if (nearest) {
          const distance = GeoNavigationHelper.calculateDistance(
            userLocation,
            nearest.coordinates
          );

          let response = `📍 Localização recebida!\n\n`;
          response += `O ponto mais próximo é:\n`;
          response += `*${nearest.name}*\n`;
          response += `${nearest.description}\n\n`;
          response += `Distância: ${GeoNavigationHelper.formatDistance(distance)}\n\n`;
          response += `Deseja ver a rota? Digite: /rota`;

          await client.sendText(chatId, response);

          // Send nearest POI location
          await client.sendLocationWithNavigation(
            chatId,
            nearest.coordinates,
            nearest.name,
            nearest.description
          );
        }
        return;
      }

      // Welcome message
      if (text === '/start' || text === 'oi' || text === 'olá' || text === 'ola') {
        const welcome = `
👋 Olá! Bem-vindo ao *Bot de Navegação Geográfica*!

Este bot pode ajudá-lo com:
🗺️ Compartilhamento de localizações
📏 Cálculo de distâncias
🧭 Planejamento de rotas
📍 Descoberta de pontos de interesse

Digite /ajuda para ver todos os comandos disponíveis.
        `;
        await client.sendText(chatId, welcome.trim());
        return;
      }

    } catch (error) {
      console.error('Error handling message:', error);
      await client.sendText(
        chatId,
        'Desculpe, ocorreu um erro ao processar sua solicitação.'
      );
    }
  });

  console.log('\n=== Geo-Navigation Bot Ready ===');
  console.log('Commands available:');
  console.log('  /ajuda - Show help');
  console.log('  /localizacao - Send location');
  console.log('  /distancia - Calculate distance');
  console.log('  /rota - Create route');
  console.log('  /perto - Find nearby POIs');
  console.log('  /poi - List all POIs');
}
