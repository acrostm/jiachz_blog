import { PageBreadcrumb } from "@/components/page-header";

import { PATHS } from "@/constants";

import { AdminContentLayout, EditDailyReportForm } from "../../components";

export const EditDailyReportPage = () => {
  return (
    <AdminContentLayout
      breadcrumb={
        <PageBreadcrumb
          breadcrumbList={[
            PATHS.ADMIN_HOME,
            PATHS.ADMIN_DAILY_REPORTS,
            PATHS.ADMIN_DAILY_REPORT_EDIT,
          ]}
        />
      }
    >
      <EditDailyReportForm />
    </AdminContentLayout>
  );
};
