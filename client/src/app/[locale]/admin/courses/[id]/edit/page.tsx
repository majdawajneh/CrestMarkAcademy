
import { notFound } from "next/navigation";
import CourseForm from "../../create/CourseForm";
type Props = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function EditCoursePage({
  params,
}: Props) {
  const { id } = await params;
  const courseId = Number(id);

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(courseId)
  ) {
    notFound();
  }

  return <CourseForm courseId={courseId} />;
}
