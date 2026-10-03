// Preguntas frecuentes: fuente única. Las usan "Acerca de" (003) y la portada (006).
// Cada respuesta tiene que ser cierta para lo que hace la app hoy (spec 003, FR-025).

export type Faq = { id: string; q: string; a: string[]; link?: { href: string; label: string } };

export const FAQ: Faq[] = [
  {
    id: "gratis",
    q: "¿Es gratis?",
    a: ["Sí, totalmente. No hay planes pagos ni publicidad."],
  },
  {
    id: "whatsapp",
    q: "¿Cómo se hace un amigo invisible por WhatsApp?",
    a: [
      "Armás el grupo, cargás los nombres y la app genera un link personal para cada participante. Lo mandás por WhatsApp con un toque.",
      "Cada persona abre su link, crea su cuenta y se suma. Cuando están todos, hacés el sorteo y a cada uno le aparece a quién le regala.",
    ],
  },
  {
    id: "organizador-ve",
    q: "¿Quien organiza puede ver a quién me tocó?",
    a: [
      "No. El sorteo lo hace el servidor y cada persona ve solo a quién le regala ella. Ni quien organiza ni nosotros podemos ver las asignaciones de los demás.",
    ],
  },
  {
    id: "cuenta",
    q: "¿Hace falta que todos tengan cuenta?",
    a: [
      "Sí: así solo vos podés ver a quién le regalás. Se crea en un minuto, con tu mail o con Google.",
    ],
  },
  {
    id: "exclusiones",
    q: "¿Cómo funcionan las exclusiones?",
    a: [
      "Podés marcar que alguien no le regale a otra persona, por ejemplo para que las parejas no se toquen entre sí. El sorteo las respeta y, si con tantas exclusiones no hay forma de sortear, te avisa.",
    ],
  },
  {
    id: "presupuesto",
    q: "¿Qué presupuesto conviene?",
    a: [
      "El que les quede cómodo a todos. Un monto fijo evita que unos regalen mucho y otros poco. Lo cargás al armar el grupo y lo ve cada participante.",
    ],
  },
  {
    id: "se-baja",
    q: "¿Qué pasa si alguien se baja después del sorteo?",
    a: [
      "Por ahora no se puede sacar a nadie de un grupo ya sorteado. Si pasa, quien organiza puede borrar el grupo y armarlo de nuevo con un sorteo nuevo. Estamos trabajando para poder reacomodar sin rehacer todo.",
    ],
  },
  {
    id: "mail",
    q: "No me llegó el mail, ¿qué hago?",
    a: [
      "Fijate en spam o en promociones. Igual, el link que te pasó quien organiza alcanza para sumarte. Si sigue sin llegar, escribinos.",
    ],
    link: { href: "/contacto", label: "Ir a contacto" },
  },
  {
    id: "lista-deseos",
    q: "¿Puedo cambiar mi lista de deseos después del sorteo?",
    a: ["Sí, cuando quieras. Quien te tiene que regalar ve siempre la versión actualizada."],
  },
  {
    id: "borrar-cuenta",
    q: "¿Cómo borro mi cuenta?",
    a: [
      "Escribinos por contacto con el motivo \"Mis datos personales\" y la borramos dentro de los plazos de la ley.",
    ],
    link: { href: "/contacto", label: "Ir a contacto" },
  },
];
