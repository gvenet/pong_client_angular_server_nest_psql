// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage = '';
  loading = false;
  
  private newMessageSubscription?: Subscription;
  private recentMessagesSubscription?: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Connecter le chat
    this.chatService.connect();

    // Écouter les nouveaux messages
    this.newMessageSubscription = this.chatService.onNewMessage().subscribe({
      next: (message) => {
        this.messages.push(message);
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('Chat error:', err);
      }
    });

    // Écouter les messages récents
    this.recentMessagesSubscription = this.chatService.onRecentMessages().subscribe({
      next: (messages) => {
        // Inverser l'ordre car ils arrivent du plus récent au plus ancien
        this.messages = messages.reverse();
        this.shouldScrollToBottom = true;
      }
    });

    // Charger les messages récents
    setTimeout(() => {
      this.chatService.getRecentMessages(50);
    }, 500);
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    if (this.newMessageSubscription) {
      this.newMessageSubscription.unsubscribe();
    }
    if (this.recentMessagesSubscription) {
      this.recentMessagesSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) {
      return;
    }

    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  isMyMessage(message: ChatMessage): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser ? message.user.id === currentUser.id : false;
  }

  getTimeString(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}