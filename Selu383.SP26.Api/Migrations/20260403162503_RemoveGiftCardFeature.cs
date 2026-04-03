using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Selu383.SP26.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGiftCardFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GiftCards");

            migrationBuilder.DropColumn(
                name: "GiftCardId",
                table: "Payments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GiftCardId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GiftCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    InitialBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurchasedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftCards", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_Code",
                table: "GiftCards",
                column: "Code",
                unique: true);
        }
    }
}
