import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { PipelinesModule } from './pipelines/pipelines.module';


@Module({
  imports: [AuthModule, UsersModule, AccountsModule, ContactsModule, LeadsModule, PipelinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
