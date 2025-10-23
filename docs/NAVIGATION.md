# Sistema de Navegação do Venom Bot

O Venom Bot agora inclui um sistema completo de navegação com duas funcionalidades principais:

1. **Navegação Conversacional** - Sistema de mapas de navegação para criar fluxos interativos de conversação
2. **Navegação Geográfica** - Ferramentas para trabalhar com localizações, rotas e pontos de interesse

## 📋 Índice

- [Navegação Conversacional](#navegação-conversacional)
  - [Conceitos Básicos](#conceitos-básicos)
  - [Criando um Mapa de Navegação](#criando-um-mapa-de-navegação)
  - [Gerenciando Sessões](#gerenciando-sessões)
  - [Eventos de Navegação](#eventos-de-navegação)
- [Navegação Geográfica](#navegação-geográfica)
  - [Enviando Localizações](#enviando-localizações)
  - [Calculando Distâncias](#calculando-distâncias)
  - [Criando Rotas](#criando-rotas)
  - [Pontos de Interesse](#pontos-de-interesse)
- [API Completa](#api-completa)
- [Exemplos](#exemplos)

---

## Navegação Conversacional

### Conceitos Básicos

A navegação conversacional permite criar **mapas de navegação** que definem fluxos de conversa interativos. Um mapa consiste em:

- **Nós (Nodes)**: Pontos no fluxo de conversa (menus, mensagens, ações)
- **Opções**: Escolhas que o usuário pode fazer em cada nó
- **Sessões**: Instâncias de navegação para cada usuário
- **Contexto**: Dados armazenados durante a navegação

### Tipos de Nós

- `menu`: Apresenta opções para o usuário escolher
- `message`: Exibe uma mensagem informativa
- `action`: Executa uma ação personalizada
- `location`: Compartilha uma localização
- `end`: Finaliza a navegação

### Criando um Mapa de Navegação

```javascript
// 1. Criar o mapa
const map = await client.createNavigationMap(
  'meu-mapa',           // ID único do mapa
  'Meu Bot',            // Nome do mapa
  'welcome',            // ID do nó inicial
  'Descrição opcional'  // Descrição
);

// 2. Adicionar nós
await client.addNavigationNode('meu-mapa', {
  id: 'welcome',
  type: 'menu',
  title: 'Bem-vindo! 👋',
  content: 'Como posso ajudá-lo?',
  options: [
    {
      id: 'opt-1',
      label: 'Opção 1',
      targetNodeId: 'node-1'
    },
    {
      id: 'opt-2',
      label: 'Opção 2',
      targetNodeId: 'node-2'
    }
  ]
});

await client.addNavigationNode('meu-mapa', {
  id: 'node-1',
  type: 'message',
  title: 'Opção 1 Selecionada',
  content: 'Aqui está a informação que você pediu.',
  options: [
    {
      id: 'opt-back',
      label: 'Voltar',
      targetNodeId: 'welcome'
    }
  ]
});
```

### Gerenciando Sessões

```javascript
// Iniciar uma sessão de navegação
const session = await client.startNavigationSession(chatId, 'meu-mapa');

// Obter sessão ativa
const activeSession = await client.getActiveNavigationSession(chatId);

// Processar entrada do usuário
client.onMessage(async (message) => {
  if (!message.isGroupMsg) {
    const handled = await client.handleNavigationInput(
      message.from,
      message.body
    );

    if (!handled) {
      // Processar outros comandos
    }
  }
});

// Navegar manualmente para um nó
await client.navigateToNode(chatId, 'node-id');

// Voltar ao nó anterior
await client.navigateBack(chatId);

// Finalizar sessão
await client.endNavigationSession(chatId);
```

### Armazenando Dados na Sessão

```javascript
// Armazenar dados
await client.updateNavigationData(chatId, {
  userName: 'João',
  preferences: ['pizza', 'hamburguer'],
  score: 100
});

// Recuperar dados
const data = await client.getNavigationData(chatId);
console.log(data.userName); // 'João'
```

### Opções Condicionais

```javascript
await client.addNavigationNode('meu-mapa', {
  id: 'menu-vip',
  type: 'menu',
  title: 'Menu VIP',
  options: [
    {
      id: 'opt-vip',
      label: 'Área VIP',
      targetNodeId: 'vip-area',
      // Só aparece se o usuário for VIP
      condition: (context) => context.data.isVIP === true
    },
    {
      id: 'opt-normal',
      label: 'Área Normal',
      targetNodeId: 'normal-area'
    }
  ]
});
```

### Eventos de Navegação

```javascript
// Sessão iniciada
client.onNavigationEvent('session_started', (event) => {
  console.log('Nova sessão:', event.sessionId);
});

// Usuário entrou em um nó
client.onNavigationEvent('node_entered', (event) => {
  console.log('Nó visitado:', event.nodeId);
  // Disparar analytics, logs, etc.
});

// Opção selecionada
client.onNavigationEvent('option_selected', (event) => {
  console.log('Opção escolhida:', event.optionId);
});

// Sessão finalizada
client.onNavigationEvent('session_ended', (event) => {
  console.log('Sessão encerrada:', event.sessionId);
});
```

### Encontrar Caminho Entre Nós

```javascript
// Encontrar o caminho mais curto entre dois nós
const path = await client.findNavigationPath('meu-mapa', 'welcome', 'final');

if (path) {
  console.log('Caminho encontrado:');
  console.log('Nós:', path.nodes);
  console.log('Distância:', path.distance);
  console.log('Passos estimados:', path.estimatedSteps);
}
```

### Importar/Exportar Mapas

```javascript
// Exportar mapa para JSON
const jsonData = await client.exportNavigationMap('meu-mapa');
console.log(jsonData);

// Salvar em arquivo
const fs = require('fs');
fs.writeFileSync('mapa.json', jsonData);

// Importar mapa
const importedMap = await client.importNavigationMap(jsonData);
```

---

## Navegação Geográfica

### Enviando Localizações

```javascript
// Enviar localização com informações adicionais
await client.sendLocationWithNavigation(
  chatId,
  {
    latitude: -23.550520,
    longitude: -46.633308
  },
  'Minha Empresa',
  'Av. Paulista, 1000 - São Paulo, SP'
);
```

### Calculando Distâncias

```javascript
const point1 = { latitude: -23.550520, longitude: -46.633308 };
const point2 = { latitude: -23.561414, longitude: -46.656178 };

// Enviar informações de distância
await client.sendDistanceInfo(
  chatId,
  point1,
  point2,
  'Ponto A',
  'Ponto B'
);

// Ou calcular manualmente
const GeoNavigationHelper = require('./api/helpers/geo-navigation').GeoNavigationHelper;
const distance = GeoNavigationHelper.calculateDistance(point1, point2);
console.log('Distância:', distance, 'metros');
```

### Criando Rotas

```javascript
const origem = { latitude: -23.550520, longitude: -46.633308 };
const destino = { latitude: -23.561414, longitude: -46.656178 };

// Criar e enviar rota
const route = await client.createAndSendRoute(chatId, origem, destino);

// Ou com pontos intermediários
const waypoints = [
  { latitude: -23.555, longitude: -46.640 }
];
const routeWithWaypoints = await client.createAndSendRoute(
  chatId,
  origem,
  destino,
  waypoints
);
```

### Pontos de Interesse (POIs)

```javascript
const pois = [
  {
    id: 'poi-1',
    name: 'Restaurante',
    description: 'Melhor comida da região',
    coordinates: { latitude: -23.550520, longitude: -46.633308 },
    category: 'Alimentação'
  },
  {
    id: 'poi-2',
    name: 'Farmácia',
    coordinates: { latitude: -23.552520, longitude: -46.635308 },
    category: 'Saúde'
  }
];

const userLocation = { latitude: -23.551, longitude: -46.634 };

// Encontrar POIs próximos (raio de 1km)
await client.sendNearbyPOIs(chatId, userLocation, pois, 1000);
```

### Utilitários Geográficos

```javascript
const GeoNavigationHelper = require('./api/helpers/geo-navigation').GeoNavigationHelper;

// Calcular direção/bearing
const bearing = GeoNavigationHelper.calculateBearing(point1, point2);
console.log('Direção:', bearing, 'graus');

// Obter direção cardinal
const direction = GeoNavigationHelper.getCardinalDirection(bearing);
console.log('Direção:', direction); // 'N', 'NE', 'E', etc.

// Obter nome da direção em português
const directionName = GeoNavigationHelper.getDirectionName(bearing);
console.log('Direção:', directionName); // 'Norte', 'Nordeste', etc.

// Formatar distância
const formatted = GeoNavigationHelper.formatDistance(1500);
console.log(formatted); // '1.50 km'

// Estimar tempo de viagem
const time = GeoNavigationHelper.estimateTravelTime(1000, 5); // 1000m a 5km/h
const timeStr = GeoNavigationHelper.formatDuration(time);
console.log('Tempo estimado:', timeStr);

// Gerar URL do Google Maps
const mapsUrl = GeoNavigationHelper.generateGoogleMapsUrl(origem, destino);
console.log('Link:', mapsUrl);

// Parsear coordenadas de texto
const coords = GeoNavigationHelper.parseCoordinates('-23.550520, -46.633308');
console.log(coords); // { latitude: -23.550520, longitude: -46.633308 }

// Encontrar POI mais próximo
const nearest = GeoNavigationHelper.findNearestPOI(userLocation, pois);
console.log('Mais próximo:', nearest.name);

// Calcular centro de múltiplos pontos
const center = GeoNavigationHelper.calculateCenter([point1, point2]);
console.log('Centro:', center);
```

---

## API Completa

### Métodos de Navegação Conversacional

```typescript
// Criar mapa
createNavigationMap(id: string, name: string, startNodeId: string, description?: string): Promise<NavigationMap>

// Adicionar nó
addNavigationNode(mapId: string, node: NavigationNode): Promise<void>

// Gerenciar sessões
startNavigationSession(chatId: string, mapId: string): Promise<NavigationSession>
getActiveNavigationSession(chatId: string, mapId?: string): Promise<NavigationSession | undefined>
endNavigationSession(chatId: string): Promise<void>

// Navegar
handleNavigationInput(chatId: string, input: string): Promise<NavigationNode | null>
navigateToNode(chatId: string, nodeId: string): Promise<NavigationNode | null>
navigateBack(chatId: string): Promise<NavigationNode | null>

// Dados da sessão
updateNavigationData(chatId: string, data: Record<string, any>): Promise<void>
getNavigationData(chatId: string): Promise<Record<string, any> | null>

// Utilitários
findNavigationPath(mapId: string, startNodeId: string, targetNodeId: string): Promise<NavigationPath | null>
exportNavigationMap(mapId: string): Promise<string>
importNavigationMap(jsonData: string): Promise<NavigationMap>

// Eventos
onNavigationEvent(eventType: NavigationEventType, callback: (event: NavigationEvent) => void): void
```

### Métodos de Navegação Geográfica

```typescript
// Enviar localizações
sendLocationWithNavigation(chatId: string, coords: GeoCoordinates, name?: string, address?: string): Promise<void>

// Rotas
sendRouteDirections(chatId: string, route: GeoRoute): Promise<void>
createAndSendRoute(chatId: string, origin: GeoCoordinates, destination: GeoCoordinates, waypoints?: GeoCoordinates[]): Promise<GeoRoute>

// Distâncias
sendDistanceInfo(chatId: string, point1: GeoCoordinates, point2: GeoCoordinates, label1?: string, label2?: string): Promise<void>

// POIs
sendNearbyPOIs(chatId: string, location: GeoCoordinates, pois: PointOfInterest[], radiusMeters?: number): Promise<void>
```

### Tipos TypeScript

```typescript
interface NavigationNode {
  id: string;
  title: string;
  description?: string;
  type: 'menu' | 'message' | 'action' | 'location' | 'end';
  content?: string;
  options?: NavigationOption[];
  action?: string;
  metadata?: Record<string, any>;
}

interface NavigationOption {
  id: string;
  label: string;
  targetNodeId: string;
  condition?: (context: NavigationContext) => boolean;
  metadata?: Record<string, any>;
}

interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

interface PointOfInterest {
  id: string;
  name: string;
  description?: string;
  coordinates: GeoCoordinates;
  category?: string;
  metadata?: Record<string, any>;
}
```

---

## Exemplos

### Exemplo 1: Bot de Atendimento ao Cliente

```javascript
const venom = require('venom-bot');

venom.create().then(async (client) => {
  // Criar mapa de atendimento
  await client.createNavigationMap('atendimento', 'Atendimento', 'inicio');

  // Nó inicial
  await client.addNavigationNode('atendimento', {
    id: 'inicio',
    type: 'menu',
    title: 'Olá! Bem-vindo ao nosso atendimento.',
    content: 'Como posso ajudá-lo?',
    options: [
      { id: '1', label: '💳 Financeiro', targetNodeId: 'financeiro' },
      { id: '2', label: '📦 Pedidos', targetNodeId: 'pedidos' },
      { id: '3', label: '❓ Dúvidas', targetNodeId: 'duvidas' },
      { id: '4', label: '👤 Falar com atendente', targetNodeId: 'atendente' }
    ]
  });

  // Processar mensagens
  client.onMessage(async (msg) => {
    if (msg.body === '/start') {
      await client.startNavigationSession(msg.from, 'atendimento');
    } else {
      await client.handleNavigationInput(msg.from, msg.body);
    }
  });
});
```

### Exemplo 2: Bot de Delivery com Localização

```javascript
const venom = require('venom-bot');

venom.create().then(async (client) => {
  const restaurantLocation = {
    latitude: -23.550520,
    longitude: -46.633308
  };

  client.onMessage(async (msg) => {
    // Usuário envia localização
    if (msg.type === 'location') {
      const userLocation = {
        latitude: parseFloat(msg.lat),
        longitude: parseFloat(msg.lng)
      };

      // Calcular distância e tempo
      await client.sendDistanceInfo(
        msg.from,
        userLocation,
        restaurantLocation,
        'Sua localização',
        'Nosso restaurante'
      );

      // Enviar rota
      await client.createAndSendRoute(
        msg.from,
        userLocation,
        restaurantLocation
      );
    }
  });
});
```

### Exemplo 3: Bot de Turismo

```javascript
const GeoNavigationHelper = require('venom-bot/dist/api/helpers/geo-navigation').GeoNavigationHelper;

const attractions = [
  {
    id: '1',
    name: 'Museu',
    coordinates: { latitude: -23.561, longitude: -46.656 },
    category: 'Cultura'
  },
  {
    id: '2',
    name: 'Parque',
    coordinates: { latitude: -23.550, longitude: -46.633 },
    category: 'Lazer'
  }
];

client.onMessage(async (msg) => {
  if (msg.type === 'location') {
    const userLoc = {
      latitude: parseFloat(msg.lat),
      longitude: parseFloat(msg.lng)
    };

    // Mostrar atrações próximas (raio de 2km)
    await client.sendNearbyPOIs(msg.from, userLoc, attractions, 2000);
  }
});
```

---

## Considerações

- **Performance**: Mapas grandes podem consumir memória. Considere limpar sessões inativas periodicamente
- **Persistência**: As sessões são armazenadas em memória. Para persistência, implemente salvamento em banco de dados
- **Validação**: Sempre valide entradas do usuário antes de processar
- **Timeout**: Sessões inativas por muito tempo são automaticamente encerradas (padrão: 1 hora)

---

## Suporte

Para mais exemplos, consulte:
- `/examples/navigation-map-example.js` - Exemplo completo de navegação conversacional
- `/examples/geo-navigation-example.js` - Exemplo completo de navegação geográfica

Para reportar problemas ou sugerir melhorias, abra uma issue no GitHub do Venom.
