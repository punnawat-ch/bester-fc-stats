import type { Metadata } from "next";
import { Users } from "lucide-react";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { ResponsiveList } from "@/components/admin/ResponsiveList";
import { FeatureTour } from "@/components/admin/help/FeatureTour";
import { CreateUserSheet } from "./create-user-sheet";
import { UserCard, UserRowCells } from "./user-list-items";
import type { UserListItem } from "./types";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

const LAST_LOGIN_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatLastLogin(date: Date | null): string {
  if (!date) {
    return "Never";
  }
  return LAST_LOGIN_FORMAT.format(date);
}

export default async function AdminUsersPage() {
  const session = await requireUser("user:manage");
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const currentUserId = session.user.id;
  const items: readonly UserListItem[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    lastLoginLabel: formatLastLogin(user.lastLoginAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manage"
        title="Users"
        count={items.length}
        description="Invite teammates and control their access to the admin."
        actions={<CreateUserSheet />}
        helpKey="users"
      />
      <FeatureTour featureKey="users" />

      <ResponsiveList
        items={items}
        getKey={(user) => user.id}
        empty={
          <EmptyState
            icon={<Users />}
            eyebrow="Team"
            title="No users yet"
            description="Invite your first teammate to get started."
            action={<CreateUserSheet />}
          />
        }
        renderCard={(user) => (
          <UserCard user={user} currentUserId={currentUserId} />
        )}
        head={
          <>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last login</th>
            <th className="text-right">Actions</th>
          </>
        }
        renderRow={(user) => (
          <UserRowCells user={user} currentUserId={currentUserId} />
        )}
      />
    </div>
  );
}
