import Link from "next/link";

type U = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export function FollowList({ users }: { users: U[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-muted">まだいません。</p>;
  }
  return (
    <div className="space-y-2">
      {users.map((u) => {
        const nm = u.display_name || "user";
        return (
          <Link
            key={u.id}
            href={`/u/${u.id}`}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface/20 p-3 transition-colors hover:border-accent"
          >
            {u.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={u.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full border border-line object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-xs text-accent">
                {nm.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span>
              <span className="block text-sm text-fg">{nm}</span>
              {u.username && (
                <span className="block font-mono text-xs text-muted">
                  @{u.username}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
