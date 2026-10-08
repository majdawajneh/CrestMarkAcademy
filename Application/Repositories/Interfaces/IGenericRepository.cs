using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace Application.Repositories.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();

        Task<T?> GetByIdAsync(int id);

        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        Task AddAsync(T entity);

        void Update(T entity);

        void Delete(T entity);

        Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

        Task<int> SaveChangesAsync();
    }
}

