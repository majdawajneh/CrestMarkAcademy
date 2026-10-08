using Application.Repositories.Interfaces;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly CrestMark_DbContext _DbContext;
        private readonly DbSet<T> _dbSet;

        public GenericRepository(CrestMark_DbContext DbContext)
        {
            _DbContext = DbContext;
            _dbSet = DbContext.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }
        public async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }
        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate);
        }
        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }
        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }
        public void Update(T entity)
        {
             _dbSet.Update(entity);
        }
        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }
        public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.AnyAsync(predicate);
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _DbContext.SaveChangesAsync();
        }


    }
}
