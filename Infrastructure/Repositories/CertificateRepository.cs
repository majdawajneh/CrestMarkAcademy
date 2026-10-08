using Application.Repositories.Interfaces;
using Domain.Entities.Learning;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class CertificateRepository
        : ICertificateRepository
    {
        private readonly
            CrestMark_DbContext
            _context;


        // =========================
        // Constructor
        // =========================

        public CertificateRepository(
            CrestMark_DbContext context)
        {
            _context = context;
        }


        // =========================
        // Get Certificate By Id
        // With Enrollment + User + Course
        // =========================

        public async Task<Certificate?>
            GetByIdWithDetailsAsync(int id)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(
                    c => c.Id == id
                );
        }


        // =========================
        // Get Certificate
        // By Enrollment
        // =========================

        public async Task<Certificate?>
            GetByEnrollmentIdWithDetailsAsync(
                int enrollmentId)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(
                    c =>
                        c.EnrollmentId
                            == enrollmentId
                );
        }


        // =========================
        // Get Certificate
        // By Certificate Number
        // =========================

        public async Task<Certificate?>
            GetByCertificateNumberWithDetailsAsync(
                string certificateNumber)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(
                    c =>
                        c.CertificateNumber
                            == certificateNumber
                );
        }


        // =========================
        // Get User Certificates
        // =========================

        public async Task<IEnumerable<Certificate>>
            GetByUserIdWithDetailsAsync(
                int userId)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.User)
                .Include(c => c.Enrollment)
                    .ThenInclude(e => e.Course)
                .Where(
                    c =>
                        c.Enrollment.UserId
                            == userId
                )
                .OrderByDescending(
                    c => c.IssuedAt
                )
                .ToListAsync();
        }


        // =========================
        // Check Certificate Number
        // =========================

        public async Task<bool>
            CertificateNumberExistsAsync(
                string certificateNumber)
        {
            return await _context
                .Set<Certificate>()
                .AsNoTracking()
                .AnyAsync(
                    c =>
                        c.CertificateNumber
                            == certificateNumber
                );
        }
    }
}