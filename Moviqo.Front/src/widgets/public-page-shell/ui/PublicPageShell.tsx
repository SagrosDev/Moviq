import type { ReactNode } from "react";
import { MoviqoMark, MoviqoWordmark } from "../../../shared/branding";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import { AppHeader, AppShell, PageContainer, PageHeader } from "../../../shared/ui";

type PublicPageShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  pageName: string;
  size?: "compact" | "default";
  title: string;
  titleId: string;
};

export const PublicPageShell = ({
  children,
  description,
  eyebrow,
  pageName,
  size = "compact",
  title,
  titleId
}: PublicPageShellProps) => {
  const { t } = useLanguage();

  return (
    <AppShell>
      <AppHeader
        brandHref="/"
        brandLabel={<MoviqoWordmark />}
        brandHomeLabel={t("app.brand.home")}
        brandMark={<MoviqoMark />}
        actions={<LanguageSelector />}
      />
      <main>
        <PageContainer size={size}>
          <div className="grid gap-moviqo-5" data-public-page={pageName}>
            <PageHeader
              description={description}
              eyebrow={eyebrow}
              title={title}
              titleId={titleId}
            />
            {children}
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
};
