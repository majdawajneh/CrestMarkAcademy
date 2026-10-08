using Application.Dto_s.Lesson;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;


namespace Application.Services
{
    public class LessonService : ILessonService
    {
        private readonly
            IGenericRepository<Lesson>
            _lessonRepo;

        private readonly
            IGenericRepository<CourseSection>
            _sectionRepo;


        // =========================
        // Constructor
        // =========================

        public LessonService(
            IGenericRepository<Lesson> lessonRepo,
            IGenericRepository<CourseSection> sectionRepo)
        {
            _lessonRepo = lessonRepo;
            _sectionRepo = sectionRepo;
        }


        // =========================
        // Get Lessons By Section
        // =========================

        public async Task<IEnumerable<LessonDto>>
            GetBySectionIdAsync(int sectionId)
        {
            await ValidateSectionAsync(sectionId);


            var lessons =
                await _lessonRepo.FindAsync(
                    l => l.CourseSectionId == sectionId
                );


            return lessons
                .OrderBy(l => l.OrderIndex)
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get Lesson By Id
        // =========================

        public async Task<LessonDto?>
            GetByIdAsync(int id)
        {
            var lesson =
                await _lessonRepo
                    .GetByIdAsync(id);


            if (lesson == null)
            {
                return null;
            }


            return MapToDto(lesson);
        }


        // =========================
        // Create Lesson
        // =========================

        public async Task<LessonDto>
            CreateAsync(
                int sectionId,
                CreateLessonDto dto)
        {
            await ValidateSectionAsync(sectionId);


            var lessonType =
                NormalizeLessonType(
                    dto.LessonType
                );


            ValidateLessonContent(
                lessonType,
                dto.VideoUrl,
                dto.AudioUrl,
                dto.Content
            );


            var lesson =
                new Lesson
                {
                    CourseSectionId =
                        sectionId,

                    Title =
                        dto.Title.Trim(),

                    Description =
                        CleanOptionalText(
                            dto.Description
                        ),

                    LessonType =
                        lessonType,

                    VideoUrl =
                        lessonType == "Video"
                            ? CleanOptionalText(dto.VideoUrl)
                            : null,

                    AudioUrl =
                        lessonType == "Audio"
                            ? CleanOptionalText(dto.AudioUrl)
                            : null,

                    Content =
                        lessonType == "Text"
                            ? CleanOptionalText(dto.Content)
                            : null,

                    DurationSeconds =
                        lessonType == "Text"
                            ? null
                            : dto.DurationSeconds,

                    OrderIndex =
                        dto.OrderIndex,

                    IsPreview =
                        dto.IsPreview,

                    IsPublished =
                        dto.IsPublished,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        null
                };


            await _lessonRepo
                .AddAsync(lesson);


            await _lessonRepo
                .SaveChangesAsync();


            return MapToDto(lesson);
        }


        // =========================
        // Update Lesson
        // =========================

        public async Task<LessonDto>
            UpdateAsync(
                int sectionId,
                int id,
                UpdateLessonDto dto)
        {
            await ValidateSectionAsync(sectionId);


            var lesson =
                await _lessonRepo
                    .GetByIdAsync(id);


            if (lesson == null ||
                lesson.CourseSectionId != sectionId)
            {
                throw new KeyNotFoundException(
                    "Lesson was not found."
                );
            }


            var lessonType =
                NormalizeLessonType(
                    dto.LessonType
                );


            ValidateLessonContent(
                lessonType,
                dto.VideoUrl,
                dto.AudioUrl,
                dto.Content
            );


            lesson.Title =
                dto.Title.Trim();

            lesson.Description =
                CleanOptionalText(
                    dto.Description
                );

            lesson.LessonType =
                lessonType;


            lesson.VideoUrl =
                lessonType == "Video"
                    ? CleanOptionalText(dto.VideoUrl)
                    : null;

            lesson.AudioUrl =
                lessonType == "Audio"
                    ? CleanOptionalText(dto.AudioUrl)
                    : null;

            lesson.Content =
                lessonType == "Text"
                    ? CleanOptionalText(dto.Content)
                    : null;


            lesson.DurationSeconds =
                lessonType == "Text"
                    ? null
                    : dto.DurationSeconds;

            lesson.OrderIndex =
                dto.OrderIndex;

            lesson.IsPreview =
                dto.IsPreview;

            lesson.IsPublished =
                dto.IsPublished;

            lesson.UpdatedAt =
                DateTime.UtcNow;


            _lessonRepo.Update(lesson);


            await _lessonRepo
                .SaveChangesAsync();


            return MapToDto(lesson);
        }


        // =========================
        // Delete Lesson
        // =========================

        public async Task DeleteAsync(
            int sectionId,
            int id)
        {
            var lesson =
                await _lessonRepo
                    .GetByIdAsync(id);


            if (lesson == null ||
                lesson.CourseSectionId != sectionId)
            {
                throw new KeyNotFoundException(
                    "Lesson was not found."
                );
            }


            _lessonRepo.Delete(lesson);


            await _lessonRepo
                .SaveChangesAsync();
        }


        // =========================
        // Validate Section
        // =========================

        private async Task
            ValidateSectionAsync(int sectionId)
        {
            var sectionExists =
                await _sectionRepo.ExistsAsync(
                    s => s.Id == sectionId
                );


            if (!sectionExists)
            {
                throw new KeyNotFoundException(
                    "Course section was not found."
                );
            }
        }


        // =========================
        // Normalize Lesson Type
        // =========================

        private static string
            NormalizeLessonType(string lessonType)
        {
            var normalized =
                lessonType
                    .Trim()
                    .ToLowerInvariant();


            return normalized switch
            {
                "video" => "Video",

                "audio" => "Audio",

                "text" => "Text",

                _ => throw new InvalidOperationException(
                    "Lesson type must be Video, Audio, or Text."
                )
            };
        }


        // =========================
        // Validate Lesson Content
        // =========================

        private static void
            ValidateLessonContent(
                string lessonType,
                string? videoUrl,
                string? audioUrl,
                string? content)
        {
            if (lessonType == "Video" &&
                string.IsNullOrWhiteSpace(videoUrl))
            {
                throw new InvalidOperationException(
                    "Video URL is required for video lessons."
                );
            }


            if (lessonType == "Audio" &&
                string.IsNullOrWhiteSpace(audioUrl))
            {
                throw new InvalidOperationException(
                    "Audio URL is required for audio lessons."
                );
            }


            if (lessonType == "Text" &&
                string.IsNullOrWhiteSpace(content))
            {
                throw new InvalidOperationException(
                    "Content is required for text lessons."
                );
            }
        }


        // =========================
        // Clean Optional Text
        // =========================

        private static string?
            CleanOptionalText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }


            return value.Trim();
        }


        // =========================
        // Mapping
        // =========================

        private static LessonDto
            MapToDto(Lesson lesson)
        {
            return new LessonDto
            {
                Id =
                    lesson.Id,

                CourseSectionId =
                    lesson.CourseSectionId,

                Title =
                    lesson.Title,

                Description =
                    lesson.Description,

                LessonType =
                    lesson.LessonType,

                VideoUrl =
                    lesson.VideoUrl,

                AudioUrl =
                    lesson.AudioUrl,

                Content =
                    lesson.Content,

                DurationSeconds =
                    lesson.DurationSeconds,

                OrderIndex =
                    lesson.OrderIndex,

                IsPreview =
                    lesson.IsPreview,

                IsPublished =
                    lesson.IsPublished,

                CreatedAt =
                    lesson.CreatedAt,

                UpdatedAt =
                    lesson.UpdatedAt
            };
        }
    }
}