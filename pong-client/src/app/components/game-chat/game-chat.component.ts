// src/app/components/game-chat/game-chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-chat.component.html',
  styleUrls: ['./game-chat.component.css']
})
export class GameChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Input() gameId!: string;

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
    console.log('Game chat initialized for game:', this.gameId);

    // Connecter le chat
    this.chatService.connect();

    // Rejoindre la room de la partie
    setTimeout(() => {
      this.chatService.joinGameRoom(this.gameId);
    }, 500);

    // Écouter les nouveaux messages
    this.newMessageSubscription = this.chatService.onNewMessage().subscribe({
      next: (message) => {
        console.log('New message received:', message, 'gameId:', message.game_id, 'expected:', this.gameId);
        // Filtrer pour n'afficher que les messages de cette partie
        if (message.game_id === this.gameId) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      },
      error: (err) => {
        console.error('Chat error:', err);
      }
    });

    // Écouter les messages récents
    this.recentMessagesSubscription = this.chatService.onRecentMessages().subscribe({
      next: (messages) => {
        console.log('Recent messages received:', messages.length, 'for game:', this.gameId);
        // Filtrer et trier les messages de cette partie
        this.messages = messages
          .filter(m => m.game_id === this.gameId)
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        this.shouldScrollToBottom = true;
      }
    });

    // Charger les messages récents de cette partie
    setTimeout(() => {
      this.chatService.getRecentMessages(50, this.gameId);
    }, 800);
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
    // Quitter la room de la partie
    this.chatService.leaveGameRoom(this.gameId);
    // Ne pas déconnecter le chat ici car il pourrait être utilisé ailleurs
  }

  sendMessage() {
    if (!this.newMessage.trim()) {
      return;
    }

    console.log('Sending message to game:', this.gameId, 'message:', this.newMessage);
    this.chatService.sendMessage(this.newMessage, this.gameId);
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
