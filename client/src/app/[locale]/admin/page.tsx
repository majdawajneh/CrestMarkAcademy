
type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({
  params,
}: Props) {
  const { locale } = await params;
  const ar = locale === "ar";

  const stats = [
    {
      label: ar ? "إجمالي الدورات" : "Total Courses",
    },
    {
      label: ar ? "إجمالي الطلاب" : "Total Students",
    },
    {
      label: ar ? "التسجيلات" : "Enrollments",
    },
    {
      label: ar ? "الطلبات" : "Orders",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 17,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#14365a",
              }}
            >
              {ar ? "نظرة عامة" : "Academy Overview"}
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "#75889f",
              }}
            >
              {ar
                ? "متابعة أهم مؤشرات الأكاديمية من مكان واحد."
                : "Key academy metrics, organized in one place."}
            </p>
          </div>

          <span
            style={{
              color: "#71849a",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {ar
              ? "بانتظار ربط الإحصائيات"
              : "Metrics integration pending"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
            gap: 16,
          }}
        >
          {stats.map((stat) => (
            <article
              key={stat.label}
              style={{
                padding: "22px 23px",
                background: "#fff",
                border: "1px solid #e0e8f2",
                borderRadius: 11,
              }}
            >
              <p
                style={{
                  margin: "0 0 21px",
                  color: "#70849b",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </p>

              <strong
                style={{
                  display: "block",
                  color: "#13385e",
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                —
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: "26px",
          background: "#fff",
          border: "1px solid #e0e8f2",
          borderRadius: 12,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            color: "#14365a",
            fontSize: 18,
          }}
        >
          {ar ? "إدارة الأكاديمية" : "Academy Management"}
        </h2>

        <p
          style={{
            maxWidth: 680,
            margin: 0,
            color: "#76889d",
            lineHeight: 1.9,
            fontSize: 13,
          }}
        >
          {ar
            ? "تم تجهيز مساحة الإدارة الأساسية. في المرحلة التالية سنربط إدارة الدورات والطلاب والإحصائيات بواجهات ASP.NET Core API الفعلية."
            : "Your administration workspace is ready. Next, we'll connect course management, students, and dashboard metrics to the existing ASP.NET Core API."}
        </p>
      </section>
    </div>
  );
}
