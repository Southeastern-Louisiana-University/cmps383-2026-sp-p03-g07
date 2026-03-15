using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Selu383.SP26.Api.Data;

public class DataContextFactory : IDesignTimeDbContextFactory<DataContext>
{
    public DataContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DataContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost,1433;Database=Selu383SP26DesignTime;User Id=sa;Password=Password123!;TrustServerCertificate=True");

        return new DataContext(optionsBuilder.Options);
    }
}
