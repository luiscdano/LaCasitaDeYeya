(() => {
  const STORAGE_KEY = 'lacasita_language';
  const DEFAULT_LANGUAGE = 'es';
  const SUPPORTED_LANGUAGES = ['es', 'en'];

  const EN_TRANSLATIONS = {
  "Abastecimiento": "Catering",
  "Abrir": "Open",
  "Abastecimiento: lineamientos de proveedores, calidad y trazabilidad.": "Catering: supplier guidelines, quality and traceability.",
  "© 2026 La Casita de Yeya - Todos los derechos reservados": "© 2026 La Casita de Yeya - All rights reserved",
  ") para auditoría operativa.": ") for operational audit.",
  "Abrir publicación de Instagram": "Open Instagram post",
  "Acciones": "Actions",
  "Abrir navegación": "Open navigation",
  "Abrir selector de idioma": "Open language selector",
  "Aguacate / Avocado": "Avocado / Avocado",
  "Aguas y Refrescos / Soft Drinks and Water": "Waters and Soft Drinks / Soft Drinks and Water",
  "Acompañado de un cremoso puré de cepa de apio de Constanza.": "Accompanied by a creamy Constanza celery strain puree.",
  "Acceso privado para gestionar estados, cola de notificaciones y monitoreo operativo.": "Private access to manage status, notification queue and operational monitoring.",
  "Alternativas de abastecimiento para evitar quiebres en cocina y operación.": "Catering alternatives to avoid disruptions in kitchen and operations.",
  "Aplicar": "Apply",
  "Aperol Spritz": "Aperol Spritz",
  "Alitas de Pollo / Chicken Wings": "Chicken Wings",
  "Americano / American": "American / American",
  "API base": "API base URL",
  "Al Ron / Rum Style": "Al Ron / Rum Style",
  "Área de Los Corales, próximo a corredores de playa y hoteles.": "Los Corales area, close to beach corridors and hotels.",
  "Arepitas de Yuca / Cassava Fritters": "Yuca Arepitas / Cassava Fritters",
  "Asopao de Camarones / Shrimp and Rice Pottage": "Asopao de Camarones / Shrimp and Rice Pottage",
  "Arroz con camarones en salsa de tomates frescos.": "Rice with shrimp in fresh tomato sauce.",
  "Bloody Mary": "Bloody Mary",
  "Bienvenidos a": "Welcome to",
  "Arroz / Rice": "Rice",
  "Arroz cremoso con chivo y ese saborcito que enamora.": "Creamy rice with goat and that little flavor that makes you fall in love.",
  "Atención para grupos, excursiones y reservas rápidas.": "Attention for groups, excursions and quick reservations.",
  "Burrito (pollo, res o vegetales)": "Burrito (chicken, beef or vegetables)",
  "Bebidas / Drinks": "Beverages / Drinks",
  "Caipiriña": "Caipirinha",
  "Café con Leche / Latte": "Coffee with Milk / Latte",
  "Cadena de suministro": "Supply chain",
  "Café y Té / Coffee and Tea": "Coffee and Tea / Coffee and Tea",
  "Cada local tiene enfoque propio, pero mantiene la identidad de sabor criollo de La Casita de Yeya.": "Each location has its own focus, but maintains the Creole flavor identity of La Casita de Yeya.",
  "Camarones / Shrimp": "Shrimp",
  "Caldo criollo de res, cerdo, pollo y víveres.": "Creole broth of beef, pork, chicken and groceries.",
  "Calamares Fritos / Fried Squid": "Fried Squid / Fried Squid",
  "Cambiar idioma": "Change language",
  "Camarón con ajo o crema": "Shrimp with garlic or cream",
  "Canal": "Channel",
  "Caldos / Soups & Stews": "Broths / Soups & Stews",
  "Camarones en salsa de coco": "Shrimp in coconut sauce",
  "Camarones guisados / Shrimp": "Stewed Shrimp",
  "Camarones en salsa (ajillo/criolla)": "Shrimps in sauce (garlic/criolla)",
  "Cancelada": "Canceled",
  "Canasticas de Plátano Verde de Camarón": "Shrimp Green Banana Baskets",
  "Cancelar": "Cancel",
  "Cargando publicaciones...": "Loading posts...",
  "Cargando clima...": "Loading weather...",
  "Canasticas de Plátano Verde (chivo, pollo, res, longaniza)": "Green Plantain Baskets (goat, chicken, beef, sausage)",
  "Canal de pedidos para pickup y reservas de grupos.": "Order channel for pickup and group reservations.",
  "Canita": "Canita",
  "Cantidad estimada de personas": "Estimated number of guests",
  "Cerrar selector de idioma": "Close language selector",
  "Carnitas Fritas o Pechuga de Pollo": "Fried Carnitas or Chicken Breast",
  "Casabe Taíno / Cassava \"Taíno\"": "Casabe Taíno / Cassava \"Taíno\"",
  "Carnaval de Langosta": "Lobster Carnival",
  "Capuchino / Cappuccino": "Cappuccino / Cappuccino",
  "Cerrar navegación": "Close navigation",
  "Chicharrón de cerdo": "pork crackling",
  "Ceviche": "Ceviche",
  "Chocolate": "Chocolate",
  "Checklist de certificaciones, tiempos de entrega y consistencia de producto.": "Checklist of certifications, delivery times and product consistency.",
  "Chinola / Passion Fruit": "Chinola / Passion Fruit",
  "Cervezas / Beer": "Beers / Beer",
  "Chicharrón de Pollo / Crispy Fried Chicken Bites": "Chicharrón de Pollo / Crispy Fried Chicken Bites",
  "Cliente": "Customer",
  "Cocido de Garbanzos / Chickpea Stew": "Chickpea Stew",
  "Coco Horneado / Baked Coconut": "Baked Coconut",
  "Chivo al Ron / Goat in Rum": "Chivo al Ron / Goat in Rum",
  "Coco Loco": "Coco Loco",
  "Cocido de Guandules / Green Pigeon Peas Stew": "Cocido de Guandules / Green Pigeon Peas Stew",
  "Comentarios": "Comments",
  "Clima": "Weather",
  "comunidad.": "community.",
  "CmLayer": "CmLayer",
  "Cócteles / Cocktails": "Cocktails / Cocktails",
  "Conectar": "Connect",
  "Conecta el panel para cargar notificaciones.": "Connect the panel to upload notifications.",
  "Conecta el panel para cargar reservas.": "Connect the panel to load reservations.",
  "Completar su plato por ración / To complete your dish": "Complete your dish per ration / To complete your dish",
  "Comida criolla bien ejecutada, ambiente acogedor y una marca cercana a la comunidad.": "Well-executed Creole food, cozy atmosphere and a brand close to the community.",
  "Confirmada": "Confirmed",
  "Confirmar": "Confirm",
  "Conexión API interna": "Internal API connection",
  "Conexión interna": "Internal connection",
  "Consolidar una operación multilateral por sucursal con experiencia consistente en cada punto.": "Consolidate a multilateral operation by branch with consistent experience at each point.",
  "Considerado uno de los mejores mondongos del mundo.": "Considered one of the best tripe in the world.",
  "Construimos una operación con impacto real: apoyo a productores locales, control de calidad y compromiso con": "We build an operation with real impact: support for local producers, quality control and commitment to",
  "Conecta primero el panel con URL y llave interna.": "Connect the panel first with API URL and internal key.",
  "Contacto": "Contact",
  "Controles de navegación superior": "Top navigation controls",
  "Corona": "Corona",
  "Correo electrónico": "Email",
  "Correo: pendiente": "Email: pending",
  "Cualquiera": "Any",
  "Daiquirí": "Daiquiri",
  "Croquetas de Pollo / Chicken Croquettes": "Chicken Croquettes",
  "Cortadito / Cuban Espresso": "Cortadito / Cuban Espresso",
  "Costillas de Cerdo / Pork Ribs": "Pork Ribs",
  "Debes colocar una Internal API Key válida.": "You must enter a valid Internal API Key.",
  "Dasani": "Dasani",
  "Debes colocar una URL base válida para la API.": "You must enter a valid base URL for the API.",
  "Desconectar": "Disconnect",
  "Delicioso caldo de garbanzo con ahumados, chorizo, pollo y papa.": "Delicious chickpea broth with smoked meats, chorizo, chicken and potato.",
  "Delicioso caldo de guandules con carnes ahumadas, pollo y yuca.": "Delicious pigeon peas broth with smoked meats, chicken and yucca.",
  "Cuéntanos lo necesario para preparar una propuesta general.": "Tell us what is necessary to prepare a general proposal.",
  "Descripción General": "General Description",
  "Días festivos: Los Horarios Pueden Variar": "Holidays: Hours may vary",
  "Demasiadas solicitudes en poco tiempo. Intenta nuevamente en unos minutos.": "Too many requests in a short time. Please try again in a few minutes.",
  "Despachar": "Dispatch",
  "Destino": "Destination",
  "Detalles de la solicitud": "Request details",
  "Dirección": "Address",
  "Descripción General: historia y propuesta de valor de La Casita de Yeya.": "General Description: history and value proposition of La Casita de Yeya.",
  "Despacho completado: {{sent}} sent, {{failed}} failed, {{requeued}} requeued.": "Dispatch completed: {{sent}} sent, {{failed}} failed, {{requeued}} requeued.",
  "DOMINICAN FOOD": "DOMINICAN FOOD",
  "Email": "Email",
  "Empresa": "Company",
  "Ej: 145": "Ex: 145",
  "Despachar cola": "Dispatch queue",
  "Downtown": "Downtown",
  "Empanadas / Dominican Patty": "Empanadas / Dominican Patty",
  "Ensaladas": "Salads",
  "Ensalada de la casa / House Salad": "House Salad / House Salad",
  "Entradas / Appetizers": "Starters / Appetizers",
  "Enviando...": "Sending...",
  "Error": "Error",
  "En nuestra casita los sabores son ricos en matices y están llenos de exquisitas mezclas e influencias que hacen": "In our little house the flavors are rich in nuances and are full of exquisite mixtures and influences that make",
  "Downtown: información operativa y comercial del local Downtown.": "Downtown: operational and commercial information about the Downtown location.",
  "Español": "Spanish",
  "Escribe aquí cualquier detalle adicional": "Write any additional details here",
  "Espacio de La Casita de Yeya en Downtown": "La Casita de Yeya space in Downtown",
  "Estado": "Status",
  "Espacio de La Casita de Yeya en Village": "La Casita de Yeya space in Village",
  "Enviar solicitud": "Send request",
  "Fajitas": "Fajitas",
  "Failed": "Failed",
  "Espresso Martini": "Espresso Martini",
  "Espacio ideal para una experiencia familiar con sazón dominicana y atención cercana.": "Ideal space for a family experience with Dominican flavor and close attention.",
  "Expreso / Espresso": "Espresso / Espresso",
  "Esta sección agrupa la narrativa principal de marca: origen, evolución, propósito y compromiso con nuestra": "This section groups together the main brand narrative: origin, evolution, purpose and commitment to our",
  "Fecha": "Date",
  "Fecha estimada": "Estimated date",
  "Fecha hasta": "Date until",
  "Fecha desde": "Date from",
  "Fecha/Hora": "Date/Time",
  "Fallidas (24h)": "Failed (24h)",
  "Filete (Res) Encebollado / Steak with Onions": "Fillet (Res) Encebollado / Steak with Onions",
  "Filete de Cerdo / Pork Fillet": "Pork Fillet / Pork Fillet",
  "Filete de Dorado a la Plancha": "Grilled Dorado Fillet",
  "Filete de Dorado al Ajillo o Coco": "Dorado Fillet with Garlic or Coconut",
  "Filete de dorado con vegetales salteados y papa como en el campo.": "Mahi mahi fillet with sautéed vegetables and potatoes like in the countryside.",
  "Fresa / Strawberry": "Strawberry / Strawberry",
  "Filete de Res / Beef Tenderloin": "Tenderloin Beef Steak",
  "Full": "Full",
  "Filete de Res en Salsa de Hongos": "Beef Steak in Mushroom Sauce",
  "Fundado con una pasión por la cocina, su historia se centra en crear recuerdos y momentos a través de": "Founded with a passion for cooking, its history focuses on creating memories and moments through",
  "Formulario base para centralizar solicitudes. Puedes conectarlo luego a correo, WhatsApp o backend.": "Base form to centralize requests. You can then connect it to email, WhatsApp or backend.",
  "Filete de Salmón / Salmon Filet": "Salmon Filet / Salmon Filet",
  "Galería destacada de La Casita de Yeya": "Featured gallery of La Casita de Yeya",
  "Gin Tonic": "Gin and tonic",
  "Flan de Leche y Caramelo": "Milk and Caramel Flan",
  "Hamburguesas": "Burgers",
  "Hora": "Time",
  "Homologación": "Homologation",
  "Guarniciones / Side Orders": "Garnishes / Side Orders",
  "Habichuelas (Frijoles) / Beans": "Beans",
  "Gaseosas / Sodas": "Soft drinks / Sodas",
  "ID": "ID",
  "Idioma": "Language",
  "Inglés": "English",
  "http_request": "http_request",
  "Horario": "Schedule",
  "Horario sugerido": "Suggested schedule",
  "Historia base, propuesta culinaria y experiencia que define a La Casita de Yeya.": "Base history, culinary proposal and experience that defines La Casita de Yeya.",
  "Identidad visual de La Casita de Yeya": "Visual identity of La Casita de Yeya",
  "Iniciamos como un concepto de sabor casero con identidad local y enfoque en calidad constante.": "We started as a concept of homemade flavor with local identity and focus on constant quality.",
  "Impacto social, trabajo con proveedores y acciones de sostenibilidad local.": "Social impact, work with suppliers and local sustainability actions.",
  "Ir a inicio": "Go to home",
  "Intentos": "Attempts",
  "Internal API Key": "Internal API Key",
  "Ir a CmLayer": "Go to CmLayer",
  "Integración comunitaria": "Community integration",
  "Ir a Facebook": "Go to Facebook",
  "Ir a Instagram": "Go to Instagram",
  "Jugos Naturales de Estación / Natural Seasonal Juice": "Natural Seasonal Juices / Natural Seasonal Juice",
  "La Casita de Yeya | Downtown": "Yeya's Little House | Downtown",
  "La Casita de Yeya | Inicio": "La Casita de Yeya | Home",
  "La Casita de Yeya | Abastecimiento": "La Casita de Yeya | Catering",
  "La Casita de Yeya": "La Casita de Yeya",
  "La Casita de Yeya | Descripción General": "La Casita de Yeya | General Description",
  "La Casita de Yeya | Reserva": "La Casita de Yeya | Reservations",
  "La Casita de Yeya | Sobre": "La Casita de Yeya | About",
  "La Casita de Yeya | Localidad": "La Casita de Yeya | Locations",
  "La Casita de Yeya | Menú": "La Casita de Yeya | Menu",
  "La Casita de Yeya | Village": "Yeya's Little House | Village",
  "La Casita de Yeya | Nuestra Huella": "La Casita de Yeya | Our Footprint",
  "La Casita de Yeya | Los Corales": "La Casita de Yeya | Los Corales",
  "La Casita de Yeya | Panel de Reservas": "La Casita de Yeya | Reservations Panel",
  "La Casita de Yeya nace para celebrar la cocina dominicana con recetas de raíz familiar, servicio cercano y": "La Casita de Yeya was born to celebrate Dominican cuisine with recipes from family roots, close service and",
  "La Casita de Yeya: sitio oficial con secciones de Localidad, Menú, Sobre, Abastecimiento y Reserva.": "La Casita de Yeya: official site with sections for Locations, Menu, About, Catering and Reservations.",
  "La fecha de reserva no puede ser anterior a hoy.": "The reservation date cannot be earlier than today.",
  "Langosta Caribeña (ajillo/criolla) por libra": "Caribbean lobster (garlic/criolla) per pound",
  "La solicitud tardó demasiado. Intenta nuevamente.": "The request took too long. Try again.",
  "La fecha del evento no puede ser anterior a hoy.": "The event date cannot be earlier than today.",
  "La solicitud tardó demasiado. Revisa tu conexión e intenta nuevamente.": "The request took too long. Check your connection and try again.",
  "Localidad": "Locations",
  "Lambí de Temporada": "Seasonal Lambí",
  "Langosta Caribeña al coco por libra": "Caribbean coconut lobster per pound",
  "Logo de La Casita de Yeya": "Logo of La Casita de Yeya",
  "Local orientado a alto flujo, pedidos rápidos y atención continua.": "Local oriented to high flow, quick orders and continuous attention.",
  "Localidad preferida": "Preferred location",
  "Limón / Lemon": "Lemon",
  "Listas para despacho": "Ready for dispatch",
  "Los Corales": "Los Corales",
  "Longaniza guisada / Dominican Sausage": "Stewed sausage / Dominican Sausage",
  "Longanizas Cibaeñas / Dominican Sausage": "Longanizas Cibaeñas / Dominican Sausage",
  "Los Tres Golpes / The Three Blows": "The Three Blows / The Three Blows",
  "Localidad: descubre Village, Downtown y Los Corales en La Casita de Yeya.": "Locations: discover Village, Downtown and Los Corales at La Casita de Yeya.",
  "Los Corales: detalle del local para el público turístico y de playa.": "Los Corales: detail of the place for the tourist and beach public.",
  "Lote despacho": "Dispatch lot",
  "Longaniza frita": "fried sausage",
  "Los Especiales del Mes": "Specials of the Month",
  "Lunes a domingo: 8:00 AM - 10:00 PM": "Monday to Sunday: 8:00 AM - 10:00 PM",
  "Lunes a jueves: 9:00 AM - 10:00 PM": "Monday to Thursday: 9:00 AM - 10:00 PM",
  "Margarita": "Margarita",
  "Menu": "Menu",
  "Lunes a domingo: 9:00 AM - 11:00 PM": "Monday to Sunday: 9:00 AM - 11:00 PM",
  "No se pudo cargar el clima ahora.": "Could not load weather right now.",
  "MENÚ": "MENU",
  "Menú": "Menu",
  "Modelo": "Model",
  "Macao Style": "Macao Style",
  "Lunes a domingo: 8:30 AM - 10:30 PM": "Monday to Sunday: 8:30 AM - 10:30 PM",
  "Mojito (Diferentes Sabores)": "Mojito (Different Flavors)",
  "Modelo base para centralizar políticas de compra, homologación de proveedores y control de calidad por lote.": "Base model to centralize purchasing policies, supplier approval and quality control per batch.",
  "mofongo con longaniza, con un ambiente cálido que busca recrear los sabores caseros y la calidez familiar.": "mofongo with sausage, with a warm atmosphere that seeks to recreate homemade flavors and family warmth.",
  "Menú oficial de La Casita de Yeya en formato libro interactivo.": "Official menu of La Casita de Yeya in interactive book format.",
  "N/A": "N/A",
  "Mofongos / Mofongos": "Mofongos / Mofongos",
  "Morir Soñando / Milk & Orange Juice Drink": "Dying Dreaming / Milk & Orange Juice Drink",
  "Navegación principal": "Main navigation",
  "No se pudieron cargar las notificaciones.": "Notifications could not be loaded.",
  "Mondongo Nistido / Tripe Stew": "Tripe Nistido / Tripe Stew",
  "No se pudieron cargar las reservas.": "Reservations could not be loaded.",
  "Nachos Aplatanados / Dominican Style Nachos": "Aplatanados Nachos / Dominican Style Nachos",
  "Nachos con ingredientes frescos y coloridos": "Nachos with fresh and colorful ingredients",
  "No se pudo actualizar el estado de la reserva.": "The reservation status could not be updated.",
  "No se pudo conectar al panel interno.": "Could not connect to internal panel.",
  "No se pudo cargar el feed en este momento.": "Could not load the feed right now.",
  "No se pudo encolar la notificación.": "The notification could not be queued.",
  "No se pudo despachar la cola.": "The queue could not be dispatched.",
  "No se pudo enviar la reserva. Intenta nuevamente.": "Could not send the reservation. Please try again.",
  "Nombre completo": "Full name",
  "No se pudo enviar la solicitud. Intenta nuevamente.": "Could not send the request. Please try again.",
  "No se pudo refrescar el panel.": "Could not refresh panel.",
  "No se pudo reintentar la notificación.": "The notification could not be retried.",
  "Notificar": "Notify",
  "Nuestra Huella": "Our Footprint",
  "Notificaciones encoladas para la reserva #{{id}}.": "Queued notifications for reservation #{{id}}.",
  "Notificación #{{id}} reintentada.": "Notification #{{id}} retried.",
  "nuestra cocina única y diversa.": "our unique and diverse cuisine.",
  "Observabilidad": "Observability",
  "notifications_dispatched": "notifications_dispatched",
  "Notificaciones en cola": "Queued notifications",
  "Origen": "Origin",
  "Nuestras Sucursales": "Our Locations",
  "Ossobuco al Vino": "Ossobuco with Wine",
  "Operaciones de reservas": "Reservation operations",
  "operaciones_alerts_skipped": "operations_alerts_skipped",
  "operations_alerts_dispatched": "operations_alerts_dispatched",
  "Nuestra Huella: impacto local, abastecimiento responsable y comunidad.": "Our Footprint: local impact, responsible sourcing and community.",
  "Página": "Page",
  "Página anterior": "Previous page",
  "Outbox actualizado.": "Outbox updated.",
  "Página siguiente": "Next page",
  "Outbox de notificaciones": "Notifications Outbox",
  "Panel interno": "Internal Panel",
  "Panna": "Panna",
  "Pan casero / Homemade Bread": "Homemade bread / Homemade Bread",
  "Panel desconectado.": "Panel disconnected.",
  "Panel listo. Ingresa URL y llave interna para conectar.": "Panel ready. Enter API URL and internal key to connect.",
  "Panel sincronizado correctamente.": "Panel synced successfully.",
  "Panel interno para gestionar reservas y notificaciones de Los Corales.": "Internal panel to manage reservations and notifications from Los Corales.",
  "Papas salteadas / Sautéed Potatoes": "Sautéed Potatoes",
  "Papas fritas / French Fries": "French Fries",
  "Pastas Criollas / Creole Pastas": "Creole Pastas / Creole Pastas",
  "Pendiente": "Pending",
  "Personas": "People",
  "Pechuga al Grill / Grilled Chicken Breast": "Pechuga al Grill / Grilled Chicken Breast",
  "Participación en actividades sociales y colaboraciones con iniciativas del entorno.": "Participation in social activities and collaborations with environmental initiatives.",
  "Pechuga Rellena / Stuffed Chicken Breast": "Pechuga Rellena / Stuffed Chicken Breast",
  "Pesca del Día (por libra)": "Catch of the Day (per pound)",
  "Pechurrina de Pollo / Chicken Nuggets": "Chicken Pechurrina / Chicken Nuggets",
  "Pega aquí la llave interna": "Paste the internal key here",
  "Piña / Pineapple": "Pineapple / Pineapple",
  "Piña Colada": "Pina Colada",
  "Pescado Frito (por libra)": "Fried Fish (per pound)",
  "Pescado a la Campesina": "Peasant Fish",
  "Pescado Samaná (por libra)": "Samana Fish (per pound)",
  "Plátano maduro / Fried Ripe Plantain": "Ripe Plantain / Fried Ripe Plantain",
  "Pescados y Mariscos / Fish & Seafood": "Fish & Seafood",
  "Pollo / Chicken": "Chicken",
  "Plátanos verdes fritos majados con ajo y chicharrón de cerdo.": "Fried green plantains mashed with garlic and pork rinds.",
  "Planificación semanal de insumos para disminuir desperdicios y mejorar costos.": "Weekly planning of supplies to reduce waste and improve costs.",
  "Plan de contingencia": "Contingency plan",
  "Powered by": "Powered by",
  "Plato criollo servido con acompañantes": "Creole dish served with companions",
  "Plato tradicional y ambientación dominicana": "Traditional dish and Dominican atmosphere",
  "Postre casero de la casa": "Homemade dessert",
  "Pollo o Cerdo": "Chicken or Pork",
  "prácticas responsables.": "responsible practices.",
  "Postres / Desserts": "Desserts / Desserts",
  "Propuesta": "Proposal",
  "Presidente Light": "Presidente Light",
  "Presidente Original": "Presidente Original",
  "Próximo intento": "Next try",
  "Proveedor local": "Local supplier",
  "Priorizamos compras a productores de la zona para sostener la economía local.": "We prioritize purchases from local producers to support the local economy.",
  "Propuesta enfocada en público turístico con experiencia dominicana.": "Proposal focused on tourist audiences with Dominican experience.",
  "Publicación reciente de Instagram": "Recent Instagram post",
  "Pulpo al Carbón / Octopus": "Charcoal Octopus / Octopus",
  "Punta Cana Village, acceso principal comercial.": "Punta Cana Village, main commercial access.",
  "Punto de experiencia para visitantes con enfoque en cocina criolla y atención de turismo activo.": "Experience point for visitors with a focus on Creole cuisine and active tourism attention.",
  "Punto de referencia para residentes y visitantes de la zona Village.": "Reference point for residents and visitors to the Village area.",
  "Quiénes somos": "Who we are",
  "Queued": "queued",
  "Quesadilla (pollo, res o queso)": "Quesadilla (chicken, beef or cheese)",
  "Quipes": "Quipes",
  "RD $825": "RD$825",
  "RD $1975 P/L": "RD $1975 P/L",
  "RD $1,200": "RD $1,200",
  "Redes sociales": "Social media",
  "Queso, Pollo guisado, Res molida guisada o Vegetales salteados": "Cheese, Stewed Chicken, Stewed Ground Beef or Sautéed Vegetables",
  "RD $875": "RD$875",
  "Reel": "reel",
  "Refrescar datos": "Refresh data",
  "Reserva": "Reservations",
  "recetas tradicionales y un servicio que invita a la nostalgia y el reencuentro.": "traditional recipes and a service that invites nostalgia and reunion.",
  "Request ID más reciente:": "Most recent Request ID:",
  "Reducción de merma": "Shrinkage reduction",
  "Reserva tu mesa": "Reserve your table",
  "Reservar ahora": "Book now",
  "RD $995": "RD$995",
  "Reserva #{{id}} actualizada a {{status}}.": "Reservation #{{id}} updated to {{status}}.",
  "Registro por lote para controlar frescura, rotación y desempeño por proveedor.": "Batch registration to control freshness, rotation and performance by supplier.",
  "Reserva ID": "Reservation ID",
  "Reservas": "Reservations",
  "Reservar en Los Corales": "Book in Los Corales",
  "Reservar en Downtown": "Book in Downtown",
  "Reservas canceladas": "Canceled reservations",
  "Reserva: formulario para reservas en Village, Downtown y Los Corales.": "Reservations: booking form for Village, Downtown and Los Corales.",
  "Reservar en Village": "Book in Village",
  "Reservas actualizadas.": "Updated reservations.",
  "Revisa logs estructurados en Cloudflare (evento": "Review structured logs in Cloudflare (event",
  "Reservas temporalmente no disponibles. Intenta nuevamente en breve.": "Reservations are temporarily unavailable. Please try again shortly.",
  "Reservas pendientes": "Pending reservations",
  "reservation_created": "reservation_created",
  "Reservas confirmadas": "Confirmed reservations",
  "Revisa los datos del formulario antes de enviarlo.": "Please review the form data before sending.",
  "Salpicón de Mariscos / Seafood Salad": "Seafood Salpicón / Seafood Salad",
  "Salsa de coco / Coconut Sauce": "Coconut Sauce / Coconut Sauce",
  "Salsa cremosa de mantequilla, vino blanco, mostaza y queso servido con pasta al ajillo.": "Creamy butter sauce, white wine, mustard and cheese served with garlic pasta.",
  "San Pellegrino": "San Pellegrino",
  "Sangría": "Sangria",
  "Rib Eye Angus": "Rib Eye Angus",
  "Risotto de Chivo": "Goat Risotto",
  "Selecciona una opción": "Select an option",
  "Sent": "Sent",
  "Seleccionar idioma": "Select language",
  "Sancocho Cibaeño / Dominican Stew Sancocho": "Sancocho Cibaeño / Dominican Stew Sancocho",
  "Sobre": "About",
  "Síguenos en Instagram": "Follow us on Instagram",
  "Servido con papas salteadas al romero.": "Served with sautéed rosemary potatoes.",
  "Sesión previa detectada. Pulsa \"Conectar\" para cargar datos.": "Previous session detected. Click \"Connect\" to load data.",
  "Sin resultados para los filtros actuales.": "No results for current filters.",
  "Solicitud enviada. Te confirmaremos la reserva pronto.": "Request sent. We will confirm your reservation soon.",
  "Solicitud enviada. Te contactaremos pronto.": "Request sent. We will contact you soon.",
  "Si necesitas bufete para una actividad, completa este formulario y nuestro equipo te contactará para coordinar disponibilidad.": "If you need a buffet for an activity, complete this form and our team will contact you to coordinate availability.",
  "Sobre: acceso a Descripción General y Nuestra Huella de La Casita de Yeya.": "About: access to General Description and Our Footprint at La Casita de Yeya.",
  "Solicitud enviada. Te contactaremos para confirmar disponibilidad.": "Request sent. We will contact you to confirm availability.",
  "Solicitud enviada. Te contactaremos para coordinar detalles.": "Request sent. We will contact you to coordinate details.",
  "Solicitud general para eventos": "General Event Request",
  "Solicitudes temporalmente no disponibles. Intenta nuevamente en breve.": "Requests are temporarily unavailable. Please try again shortly.",
  "Somos un reconocido restaurante que destaca por ofrecer auténtica cocina caribeña y latina, destacando el": "We are a renowned restaurant that stands out for offering authentic Caribbean and Latin cuisine, highlighting the",
  "Está lloviendo ahora.": "It is raining right now.",
  "Tajos / Meats": "Tajos / Meats",
  "Tamarindo / Tamarind": "Tamarind / Tamarind",
  "Sopa de Pollo / Chicken Soup": "Chicken Soup",
  "Sopa de Pescado / Fish Soup": "Fish Soup",
  "Teléfono": "Phone",
  "Teléfono restaurante:": "Restaurant phone:",
  "Todas": "All",
  "Té / Tea": "Tea",
  "Sucursal orientada a ritmo urbano, alta rotación y experiencia rápida de servicio.": "Branch oriented to urban rhythm, high turnover and fast service experience.",
  "Tequila Sunrise": "Tequila Sunrise",
  "Todos": "All",
  "Tostones": "Tostones",
  "Total: 0": "Total: 0",
  "Tradicional": "Traditional",
  "Trazabilidad": "Traceability",
  "Té con Leche / Tea with Milk": "Té con Leche / Tea with Milk",
  "Validando credenciales...": "Validating credentials...",
  "Tradicional / Traditional": "Traditional / Traditional",
  "Viernes y sábado: 9:00 AM - 11:00 PM": "Friday and Saturday: 9:00 AM - 11:00 PM",
  "Vegetales al grill / Grilled Vegetables": "Grilled Vegetables / Grilled Vegetables",
  "Te invitamos a conocer un poco de nuestra historia a través de nuestros platos en la Casita de Yeya.": "We invite you to learn a little about our history through our dishes at Casita de Yeya.",
  "Ver Downtown": "See Downtown",
  "Village": "Village",
  "Ver Los Corales": "See Los Corales",
  "Ver menú": "View menu",
  "Ver perfil en Instagram": "View Instagram profile",
  "WhatsApp": "WhatsApp",
  "WhatsApp: pendiente": "WhatsApp: pending",
  "Visión": "Vision",
  "una experiencia de mesa auténtica en Punta Cana.": "an authentic table experience in Punta Cana.",
  "Vodka Tonic": "Vodka Tonic",
  "Ver Village": "View Village",
  "Village: información operativa y de experiencia del local Village.": "Village: operational and experience information for the Village location.",
  "WhatsApp y llamadas directas para pedidos y reservas.": "WhatsApp and direct calls for orders and reservations.",
  "No está lloviendo ahora.": "It is not raining right now.",
  "Domingos: 9:00 AM - 10:00 PM": "Sundays: 9:00 AM - 10:00 PM",
  "Whisky Sour": "Whiskey Sour",
  "Yaroas": "Yaroas",
  "Ya recibimos una solicitud similar recientemente.": "We already received a similar request recently.",
  "Zona Downtown Punta Cana, área gastronómica principal.": "Downtown Punta Cana area, main gastronomic area.",
  "MODELO": "Modelo",
  "Reintentar": "Retry",
  "Refrescar": "Refresh",
  "Panel desconectado.": "Panel disconnected.",
  "Panel listo. Ingresa URL y llave interna para conectar.": "Panel ready. Enter base URL and internal key to connect.",
  "No se pudo conectar al panel interno.": "Could not connect to the internal panel.",
  "No se pudo actualizar el estado de la reserva.": "Could not update the reservation status.",
  "No se pudo encolar la notificación.": "Could not queue the notification.",
  "No se pudo despachar la cola.": "Could not dispatch the queue.",
  "No se pudo reintentar la notificación.": "Could not retry the notification.",
  "No se pudo refrescar el panel.": "Could not refresh the panel.",
  "Reservas actualizadas.": "Reservations updated.",
  "Outbox actualizado.": "Outbox updated.",
  "No se pudieron cargar las reservas.": "Could not load reservations.",
  "No se pudieron cargar las notificaciones.": "Could not load notifications.",
  "Panel sincronizado correctamente.": "Panel synchronized correctly."
};
  const DYNAMIC_MESSAGES = {
  "es": {
    "common.rate_limit_retry_minutes": "Demasiadas solicitudes en poco tiempo. Intenta nuevamente en {{minutes}} minuto(s).",
    "admin.total_count": "Total: {{count}}",
    "admin.reservation_updated": "Reserva #{{id}} actualizada a {{status}}.",
    "admin.notifications_queued": "Notificaciones encoladas para la reserva #{{id}}.",
    "admin.dispatch_summary": "Despacho completado: {{sent}} enviadas, {{failed}} fallidas, {{requeued}} reencoladas.",
    "admin.notification_retried": "Notificación #{{id}} reintentada.",
    "admin.http_error": "Error HTTP {{status}}",
    "village.weather.zone": "Zona: {{place}}",
    "village.weather.raining": "Está lloviendo ahora.",
    "village.weather.clear": "No está lloviendo ahora.",
    "village.weather.updated": "{{zone}} · {{temp}}°C · Viento {{wind}} km/h · {{rain}} · Actualizado: {{time}}",
    "village.weather.unavailable": "No se pudo cargar el clima ahora."
  },
  "en": {
    "common.rate_limit_retry_minutes": "Too many requests in a short time. Try again in {{minutes}} minute(s).",
    "admin.total_count": "Total: {{count}}",
    "admin.reservation_updated": "Reservation #{{id}} updated to {{status}}.",
    "admin.notifications_queued": "Notifications queued for reservation #{{id}}.",
    "admin.dispatch_summary": "Dispatch completed: {{sent}} sent, {{failed}} failed, {{requeued}} requeued.",
    "admin.notification_retried": "Notification #{{id}} retried.",
    "admin.http_error": "HTTP error {{status}}",
    "village.weather.zone": "Area: {{place}}",
    "village.weather.raining": "It is raining right now.",
    "village.weather.clear": "It is not raining right now.",
    "village.weather.updated": "{{zone}} · {{temp}}°C · Wind {{wind}} km/h · {{rain}} · Updated: {{time}}",
    "village.weather.unavailable": "Could not load weather right now."
  }
};

  const trackedTextNodes = [];
  const trackedAttrNodes = [];
  const trackedTextNodeSet = new WeakSet();
  const trackedAttrNodeMap = new WeakMap();

  let currentLanguage = DEFAULT_LANGUAGE;

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
  }

  function getStoredLanguage() {
    const stored = String(window.localStorage.getItem(STORAGE_KEY) || '').trim().toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
    return DEFAULT_LANGUAGE;
  }

  function setStoredLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }
  }

  function preserveSpacing(original, translatedNormalized) {
    const source = String(original || '');
    const translated = String(translatedNormalized || '');
    const leading = source.match(/^\s*/)?.[0] || '';
    const trailing = source.match(/\s*$/)?.[0] || '';
    return `${leading}${translated}${trailing}`;
  }

  const replaceCandidates = Object.entries(EN_TRANSLATIONS)
    .filter(([source, target]) => {
      const normalizedSource = normalizeText(source);
      const normalizedTarget = normalizeText(target);
      return normalizedSource && normalizedTarget && normalizedSource !== normalizedTarget;
    })
    .map(([source, target]) => [normalizeText(source), normalizeText(target)])
    .sort((a, b) => b[0].length - a[0].length);

  function translateNormalizedText(normalized, language) {
    if (!normalized || language === 'es') return normalized;

    const direct = EN_TRANSLATIONS[normalized];
    if (typeof direct === 'string' && direct.trim()) return direct;

    let translated = normalized;
    for (const [source, target] of replaceCandidates) {
      if (source.length < 7) continue;
      if (!translated.includes(source)) continue;
      translated = translated.replace(new RegExp(escapeRegExp(source), 'g'), target);
    }

    return translated;
  }

  function translateText(rawText, language = currentLanguage) {
    if (language === 'es') return rawText;
    const normalized = normalizeText(rawText);
    if (!normalized) return rawText;
    const translatedNormalized = translateNormalizedText(normalized, language);
    if (!translatedNormalized || translatedNormalized === normalized) return rawText;
    return preserveSpacing(rawText, translatedNormalized);
  }

  function formatTemplate(template, vars = {}) {
    let result = String(template || '');
    Object.entries(vars || {}).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g'), String(value ?? ''));
    });
    return result;
  }

  function formatMessage(key, vars = {}, fallback = '') {
    const messages = DYNAMIC_MESSAGES[currentLanguage] || {};
    const template = messages[key] || fallback || '';
    if (!template) return '';
    return formatTemplate(template, vars);
  }

  function collectTextNodes() {
    if (!document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!normalizeText(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let node = walker.nextNode();
    while (node) {
      if (!trackedTextNodeSet.has(node)) {
        trackedTextNodeSet.add(node);
        trackedTextNodes.push({ node, original: node.nodeValue || '' });
      }
      node = walker.nextNode();
    }

    const titleEl = document.querySelector('head > title');
    if (titleEl?.firstChild && !trackedTextNodeSet.has(titleEl.firstChild)) {
      trackedTextNodeSet.add(titleEl.firstChild);
      trackedTextNodes.push({ node: titleEl.firstChild, original: titleEl.firstChild.nodeValue || '' });
    }
  }

  function trackAttribute(element, attrName) {
    const currentValue = element.getAttribute(attrName);
    if (currentValue == null || !normalizeText(currentValue)) return;

    let attrSet = trackedAttrNodeMap.get(element);
    if (!attrSet) {
      attrSet = new Set();
      trackedAttrNodeMap.set(element, attrSet);
    }
    if (attrSet.has(attrName)) return;
    attrSet.add(attrName);

    trackedAttrNodes.push({ element, attrName, original: currentValue });
  }

  function collectAttributeNodes() {
    document.querySelectorAll('[aria-label], [placeholder], [title], [alt]').forEach((element) => {
      if (element.hasAttribute('aria-label')) trackAttribute(element, 'aria-label');
      if (element.hasAttribute('placeholder')) trackAttribute(element, 'placeholder');
      if (element.hasAttribute('title')) trackAttribute(element, 'title');
      if (element.hasAttribute('alt')) trackAttribute(element, 'alt');
    });

    document.querySelectorAll('head meta[name="description"][content]').forEach((element) => {
      trackAttribute(element, 'content');
    });
  }

  function applyTranslations() {
    collectTextNodes();
    collectAttributeNodes();

    trackedTextNodes.forEach((entry) => {
      if (!entry?.node?.isConnected) return;
      entry.node.nodeValue = translateText(entry.original, currentLanguage);
    });

    trackedAttrNodes.forEach((entry) => {
      if (!entry?.element?.isConnected) return;
      entry.element.setAttribute(entry.attrName, translateText(entry.original, currentLanguage));
    });

    document.documentElement.lang = currentLanguage;
  }

  function closeLanguageMenu(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('is-open');
    const toggle = wrapper.querySelector('[data-lang-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    const menu = wrapper.querySelector('[data-lang-menu]');
    if (menu) menu.hidden = true;
  }

  function openLanguageMenu(wrapper) {
    if (!wrapper) return;
    wrapper.classList.add('is-open');
    const toggle = wrapper.querySelector('[data-lang-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    const menu = wrapper.querySelector('[data-lang-menu]');
    if (menu) menu.hidden = false;
  }

  function updateSwitcherLabel() {
    const currentNode = document.querySelector('[data-lang-current]');
    if (currentNode) {
      currentNode.textContent = currentLanguage.toUpperCase();
    }

    const toggle = document.querySelector('[data-lang-toggle]');
    if (toggle) {
      const label = currentLanguage === 'en' ? 'Change language' : 'Cambiar idioma';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    }

    document.querySelectorAll('[data-lang-option]').forEach((option) => {
      const lang = option.getAttribute('data-lang-option');
      const selected = lang === currentLanguage;
      option.setAttribute('aria-pressed', selected ? 'true' : 'false');
      option.classList.toggle('is-active', selected);
    });

    const esOption = document.querySelector('[data-lang-option="es"]');
    if (esOption) {
      esOption.textContent = currentLanguage === 'en' ? 'Spanish' : 'Español';
    }

    const enOption = document.querySelector('[data-lang-option="en"]');
    if (enOption) {
      enOption.textContent = currentLanguage === 'en' ? 'English' : 'Inglés';
    }
  }

  function injectLanguageSwitcher() {
    const topbarInner = document.querySelector('.topbar .topbar-inner');
    if (!topbarInner || topbarInner.querySelector('[data-lang-switcher]')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';
    wrapper.setAttribute('data-lang-switcher', 'true');
    wrapper.setAttribute('data-i18n-skip', 'true');
    wrapper.innerHTML = `
      <button type="button" class="lang-switcher-toggle" data-lang-toggle aria-haspopup="true" aria-expanded="false" aria-label="Cambiar idioma" title="Cambiar idioma">
        <span class="lang-switcher-globe" aria-hidden="true">
          <span class="lang-globe-meridian"></span>
          <span class="lang-globe-latitude"></span>
        </span>
        <span class="lang-switcher-current" data-lang-current>ES</span>
      </button>
      <div class="lang-switcher-menu" data-lang-menu hidden>
        <button type="button" class="lang-switcher-option" data-lang-option="es" aria-pressed="true">Español</button>
        <button type="button" class="lang-switcher-option" data-lang-option="en" aria-pressed="false">Inglés</button>
      </div>
    `;

    topbarInner.appendChild(wrapper);

    const toggle = wrapper.querySelector('[data-lang-toggle]');
    const options = wrapper.querySelectorAll('[data-lang-option]');

    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (wrapper.classList.contains('is-open')) {
        closeLanguageMenu(wrapper);
      } else {
        openLanguageMenu(wrapper);
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const next = option.getAttribute('data-lang-option') || DEFAULT_LANGUAGE;
        setLanguage(next);
        closeLanguageMenu(wrapper);
      });
    });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Node)) return;
      if (!wrapper.contains(event.target)) {
        closeLanguageMenu(wrapper);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLanguageMenu(wrapper);
      }
    });

    updateSwitcherLabel();
  }

  function setLanguage(nextLanguage) {
    const normalized = String(nextLanguage || '').trim().toLowerCase();
    const language = SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;

    currentLanguage = language;
    setStoredLanguage(language);
    applyTranslations();
    updateSwitcherLabel();

    window.dispatchEvent(
      new CustomEvent('lcy:language-changed', {
        detail: {
          language,
        },
      }),
    );
  }

  function getLanguage() {
    return currentLanguage;
  }

  function init() {
    currentLanguage = getStoredLanguage();
    injectLanguageSwitcher();
    applyTranslations();
    updateSwitcherLabel();
  }

  window.LaCasitaI18n = {
    init,
    setLanguage,
    getLanguage,
    translate: (text) => translateText(text, currentLanguage),
    format: (key, vars, fallback) => formatMessage(key, vars, fallback),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
