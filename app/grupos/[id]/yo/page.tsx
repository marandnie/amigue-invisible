import Link from "next/link";
import { notFound } from "next/navigation";

import { addWishAction, deleteWishAction, updateWishAction } from "@/app/grupos/actions";
import { ActionButton } from "@/components/groups/action-button";
import { GroupDetails } from "@/components/groups/group-details";
import { RevealCard } from "@/components/groups/reveal-card";
import { AddWishForm, EditWishForm } from "@/components/groups/wish-forms";
import { getMyPage, type Wish } from "@/lib/data/groups";
import { NotFoundError } from "@/lib/domain/errors";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Mi página" };

export default async function MiPaginaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/grupos/${id}/yo`);
  const page = await getMyPage(user, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  const { group, myWishes, myReceiver } = page;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <Link href={`/grupos/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {group.name}
        </Link>
        <h1 className="font-display text-3xl font-bold">Mi página</h1>
      </div>

      {group.status === "sorteado" && myReceiver ? (
        <section className="space-y-4">
          <RevealCard receiverName={myReceiver.name} />
          <div className="rounded-lg border p-5">
            <h2 className="mb-2 font-semibold">Lista de deseos de {myReceiver.name}</h2>
            {myReceiver.wishes.length ? (
              <WishList wishes={myReceiver.wishes} />
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no cargó nada. ¡Va a tener que ser sorpresa!</p>
            )}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Todavía no se hizo el sorteo. Cuando {group.hostName} lo haga, vas a ver acá a quién le regalás.
        </p>
      )}

      <section className="space-y-3 rounded-lg border p-5">
        <h2 className="text-xl font-semibold">Mi lista de deseos</h2>
        <p className="text-sm text-muted-foreground">
          Quien te regale va a ver esta lista. La podés cambiar cuando quieras, también después del sorteo.
        </p>
        {myWishes.length ? (
          <ul className="divide-y">
            {myWishes.map((w) => (
              <li key={w.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <WishItem wish={w} />
                  <ActionButton action={deleteWishAction.bind(null, id, w.id)} variant="ghost" pendingLabel="…">
                    Borrar
                  </ActionButton>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Editar</summary>
                  <EditWishForm action={updateWishAction.bind(null, id, w.id)} text={w.text} url={w.url} />
                </details>
              </li>
            ))}
          </ul>
        ) : null}
        <AddWishForm action={addWishAction.bind(null, id)} />
      </section>

      <section className="rounded-lg border p-5">
        <GroupDetails group={group} />
      </section>
    </div>
  );
}

function WishItem({ wish }: { wish: Wish }) {
  return (
    <div className="min-w-0">
      <p className="break-words">{wish.text}</p>
      {wish.url ? (
        <a
          href={wish.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block truncate text-sm text-primary underline underline-offset-2"
        >
          {wish.url}
        </a>
      ) : null}
    </div>
  );
}

function WishList({ wishes }: { wishes: Wish[] }) {
  return (
    <ul className="space-y-2">
      {wishes.map((w) => (
        <li key={w.id} className="rounded-md bg-muted p-3">
          <WishItem wish={w} />
        </li>
      ))}
    </ul>
  );
}
