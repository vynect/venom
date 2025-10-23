/**
 * Navigation Map System Example
 *
 * This example demonstrates how to create and use navigation maps
 * for building interactive conversational flows in your WhatsApp bot.
 */

const venom = require('../dist');

// Create bot instance with navigation features
venom
  .create({
    session: 'navigation-example',
    multidevice: true,
  })
  .then(async (client) => {
    console.log('Bot started successfully!');
    await start(client);
  })
  .catch((err) => {
    console.error('Error starting bot:', err);
  });

async function start(client) {
  // ============= CONVERSATIONAL NAVIGATION EXAMPLE =============

  // 1. Create a navigation map for a restaurant menu
  const restaurantMap = await client.createNavigationMap(
    'restaurant-menu',
    'Cardápio do Restaurante',
    'welcome',
    'Sistema de pedidos do restaurante'
  );

  // 2. Define navigation nodes
  const nodes = [
    {
      id: 'welcome',
      type: 'menu',
      title: 'Bem-vindo ao Restaurante Bot! 🍽️',
      content: 'Como posso ajudá-lo hoje?',
      options: [
        {
          id: 'opt-menu',
          label: 'Ver Cardápio',
          targetNodeId: 'menu',
        },
        {
          id: 'opt-hours',
          label: 'Horário de Funcionamento',
          targetNodeId: 'hours',
        },
        {
          id: 'opt-location',
          label: 'Localização',
          targetNodeId: 'location',
        },
      ],
    },
    {
      id: 'menu',
      type: 'menu',
      title: 'Nosso Cardápio 📋',
      content: 'Escolha uma categoria:',
      options: [
        {
          id: 'opt-starters',
          label: 'Entradas',
          targetNodeId: 'starters',
        },
        {
          id: 'opt-mains',
          label: 'Pratos Principais',
          targetNodeId: 'mains',
        },
        {
          id: 'opt-desserts',
          label: 'Sobremesas',
          targetNodeId: 'desserts',
        },
        {
          id: 'opt-back',
          label: 'Voltar ao início',
          targetNodeId: 'welcome',
        },
      ],
    },
    {
      id: 'starters',
      type: 'menu',
      title: 'Entradas 🥗',
      content:
        '1. Salada Caesar - R$ 25,00\n2. Bruschetta - R$ 18,00\n3. Carpaccio - R$ 32,00',
      options: [
        {
          id: 'opt-order',
          label: 'Fazer Pedido',
          targetNodeId: 'order',
        },
        {
          id: 'opt-menu-back',
          label: 'Voltar ao Cardápio',
          targetNodeId: 'menu',
        },
      ],
    },
    {
      id: 'mains',
      type: 'menu',
      title: 'Pratos Principais 🍝',
      content:
        '1. Spaghetti Carbonara - R$ 42,00\n2. Picanha Grelhada - R$ 65,00\n3. Risoto de Funghi - R$ 48,00',
      options: [
        {
          id: 'opt-order',
          label: 'Fazer Pedido',
          targetNodeId: 'order',
        },
        {
          id: 'opt-menu-back',
          label: 'Voltar ao Cardápio',
          targetNodeId: 'menu',
        },
      ],
    },
    {
      id: 'desserts',
      type: 'menu',
      title: 'Sobremesas 🍰',
      content:
        '1. Tiramisu - R$ 22,00\n2. Petit Gateau - R$ 28,00\n3. Cheesecake - R$ 24,00',
      options: [
        {
          id: 'opt-order',
          label: 'Fazer Pedido',
          targetNodeId: 'order',
        },
        {
          id: 'opt-menu-back',
          label: 'Voltar ao Cardápio',
          targetNodeId: 'menu',
        },
      ],
    },
    {
      id: 'hours',
      type: 'message',
      title: 'Horário de Funcionamento ⏰',
      content:
        'Segunda a Sexta: 11:00 - 23:00\nSábado e Domingo: 12:00 - 00:00',
      options: [
        {
          id: 'opt-home',
          label: 'Voltar ao início',
          targetNodeId: 'welcome',
        },
      ],
    },
    {
      id: 'location',
      type: 'location',
      title: 'Nossa Localização 📍',
      content: 'Estamos localizados no centro da cidade.',
      options: [
        {
          id: 'opt-home',
          label: 'Voltar ao início',
          targetNodeId: 'welcome',
        },
      ],
    },
    {
      id: 'order',
      type: 'message',
      title: 'Pedido',
      content:
        'Para fazer um pedido, entre em contato pelo telefone: (11) 1234-5678',
      options: [
        {
          id: 'opt-home',
          label: 'Voltar ao início',
          targetNodeId: 'welcome',
        },
        {
          id: 'opt-end',
          label: 'Finalizar',
          targetNodeId: 'end',
        },
      ],
    },
    {
      id: 'end',
      type: 'end',
      title: 'Obrigado!',
      content: 'Obrigado por usar nosso serviço. Até logo! 👋',
    },
  ];

  // 3. Add all nodes to the map
  for (const node of nodes) {
    await client.addNavigationNode('restaurant-menu', node);
  }

  console.log('Navigation map created successfully!');

  // 4. Listen for navigation events
  client.onNavigationEvent('session_started', (event) => {
    console.log('Navigation session started:', event.sessionId);
  });

  client.onNavigationEvent('node_entered', (event) => {
    console.log('User entered node:', event.nodeId);
  });

  client.onNavigationEvent('option_selected', (event) => {
    console.log('User selected option:', event.optionId);
  });

  // 5. Handle incoming messages
  client.onMessage(async (message) => {
    // Ignore group messages and own messages
    if (message.isGroupMsg || message.from === 'status@broadcast') return;

    console.log('Received message:', message.body);

    const chatId = message.from;

    // Check if user has an active navigation session
    let session = await client.getActiveNavigationSession(chatId);

    if (!session) {
      // Start commands
      if (message.body.toLowerCase().includes('/menu') ||
          message.body.toLowerCase().includes('cardápio') ||
          message.body.toLowerCase().includes('iniciar')) {
        // Start navigation session
        session = await client.startNavigationSession(chatId, 'restaurant-menu');
        return;
      }
    } else {
      // Handle navigation input
      const handled = await client.handleNavigationInput(chatId, message.body);

      if (!handled) {
        // If input wasn't handled by navigation, check for special commands
        if (message.body.toLowerCase() === 'voltar') {
          await client.navigateBack(chatId);
        } else if (message.body.toLowerCase() === 'sair') {
          await client.endNavigationSession(chatId);
        } else {
          // Try to parse as option number
          const optionNum = parseInt(message.body);
          if (!isNaN(optionNum)) {
            const currentNode = await client.getNavigationManager().getCurrentNode(session.id);
            if (currentNode && currentNode.options && optionNum > 0 && optionNum <= currentNode.options.length) {
              const option = currentNode.options[optionNum - 1];
              await client.handleNavigationInput(chatId, option.id);
            }
          }
        }
      }
    }
  });

  // ============= GEOGRAPHIC NAVIGATION EXAMPLE =============

  // Example: Send location with navigation info
  const restaurantLocation = {
    latitude: -23.550520,
    longitude: -46.633308,
  };

  // This would be triggered by a specific command or menu option
  // await client.sendLocationWithNavigation(
  //   'chatId@c.us',
  //   restaurantLocation,
  //   'Restaurante Bot',
  //   'Av. Paulista, 1000 - São Paulo, SP'
  // );

  // Example: Calculate and send distance
  const userLocation = {
    latitude: -23.561414,
    longitude: -46.656178,
  };

  // await client.sendDistanceInfo(
  //   'chatId@c.us',
  //   userLocation,
  //   restaurantLocation,
  //   'Sua localização',
  //   'Restaurante Bot'
  // );

  // Example: Create and send route
  // const route = await client.createAndSendRoute(
  //   'chatId@c.us',
  //   userLocation,
  //   restaurantLocation
  // );

  console.log('\n=== Navigation System Ready ===');
  console.log('Send "/menu" or "cardápio" to any chat to start navigation!');
}
