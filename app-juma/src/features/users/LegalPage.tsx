import React from "react";

type LegalPageProps = {
  type: "privacy" | "terms";
  onBack: () => void;
};

const sections = {
  privacy: {
    eyebrow: "Privacidad",
    title: "Política de privacidad",
    intro:
      "En JUMA Accessory cuidamos los datos que compartís al navegar, crear una cuenta o realizar una compra.",
    items: [
      {
        title: "Datos que recopilamos",
        body: "Podemos recibir tu nombre, correo electrónico, teléfono, dirección de entrega, productos favoritos y datos de tus pedidos. Si ingresás con Google, recibimos los datos básicos autorizados por tu cuenta, como nombre y correo electrónico. JUMA nunca recibe tu contraseña de Google.",
      },
      {
        title: "Cómo usamos la información",
        body: "Usamos estos datos para identificar tu cuenta, gestionar compras y entregas, responder consultas, mostrar tus favoritos y mejorar el funcionamiento de la tienda.",
      },
      {
        title: "Servicios que utilizamos",
        body: "La autenticación y parte de los datos operativos se procesan mediante Supabase. Google participa únicamente cuando elegís iniciar sesión con Google. La tienda se entrega mediante la infraestructura de Cloudflare.",
      },
      {
        title: "Conservación y seguridad",
        body: "Conservamos la información mientras sea necesaria para prestar el servicio, mantener el historial de compras y cumplir obligaciones aplicables. Aplicamos controles de acceso y sesiones protegidas para evitar accesos no autorizados.",
      },
      {
        title: "Tus derechos",
        body: "Podés solicitar acceso, corrección o eliminación de tus datos escribiendo a Juma.accesorio@gmail.com. También podés cerrar sesión en cualquier momento desde tu perfil.",
      },
    ],
  },
  terms: {
    eyebrow: "Condiciones",
    title: "Términos y condiciones",
    intro:
      "Estas condiciones regulan el uso de la tienda online de JUMA Accessory y las compras realizadas desde Argentina.",
    items: [
      {
        title: "Productos y disponibilidad",
        body: "Las imágenes y descripciones buscan representar cada producto con precisión. Los tonos y medidas pueden variar ligeramente. Toda compra está sujeta a disponibilidad y confirmación de stock.",
      },
      {
        title: "Precios y pagos",
        body: "Los precios se muestran en pesos argentinos. El pedido queda confirmado cuando JUMA valida el medio de pago y la disponibilidad de los productos seleccionados.",
      },
      {
        title: "Envíos y entregas",
        body: "Los costos, plazos y modalidades de entrega se informan durante la coordinación del pedido. Los plazos pueden variar según el destino y el servicio de transporte.",
      },
      {
        title: "Cambios y devoluciones",
        body: "Para solicitar un cambio o informar un inconveniente, escribinos dentro de los 10 días corridos posteriores a la recepción. El producto debe conservarse sin uso y con su presentación original. Los derechos previstos por la normativa argentina de defensa del consumidor se mantienen vigentes.",
      },
      {
        title: "Contacto",
        body: "Podés comunicarte con JUMA Accessory en Córdoba, Argentina, por correo a Juma.accesorio@gmail.com o mediante Instagram en @Juma.accessory.",
      },
    ],
  },
} as const;

export default function LegalPage({ type, onBack }: LegalPageProps): React.ReactElement {
  const content = sections[type];

  return (
    <main className="grow bg-[#fbfaf8] px-5 py-12 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl border border-primary/10 bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-14">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">{content.eyebrow}</p>
        <h1 className="font-serif text-3xl text-slate-800 sm:text-5xl">{content.title}</h1>
        <p className="mt-5 leading-7 text-slate-600">{content.intro}</p>
        <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">Última actualización: 13 de septiembre de 2026</p>

        <div className="mt-10 space-y-8">
          {content.items.map((item) => (
            <section key={item.title}>
              <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{item.body}</p>
            </section>
          ))}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-12 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary/90"
        >
          <span translate="no" className="material-symbols-outlined text-lg">arrow_back</span>
          Volver a la tienda
        </button>
      </article>
    </main>
  );
}
